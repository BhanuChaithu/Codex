import os
import re
import json
import logging
from app.agents.base import BaseAgent

logger = logging.getLogger(__name__)

class BugHunterAgent(BaseAgent):
    def __init__(self):
        super().__init__("Bug Hunter")

    async def scan_repository(self, project_path: str, files_list: list) -> list:
        """Statically scans files for common code issues, and supplements with LLM if keys exist."""
        issues = []
        
        # 1. Local static scans (always runs)
        for rel_path in files_list:
            full_path = os.path.join(project_path, rel_path)
            if not os.path.isfile(full_path) or os.path.getsize(full_path) > 500 * 1024:
                continue
                
            ext = os.path.splitext(rel_path)[1].lower()
            if ext not in [".py", ".js", ".ts", ".tsx", ".jsx"]:
                continue
                
            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    lines = content.splitlines()
                    
                    # Check for dead code (lines after return/raise statement within same block)
                    in_func = False
                    returned = False
                    indent_level = 0
                    
                    for idx, line in enumerate(lines):
                        line_num = idx + 1
                        stripped = line.strip()
                        
                        # Infinite loops checker
                        if re.search(r"while\s+True\s*:", line) or re.search(r"while\s*\(\s*true\s*\)", line):
                            # Verify if there is a break in the block
                            has_break = False
                            # scan next 10 lines for break
                            for k in range(1, min(15, len(lines) - idx)):
                                next_line = lines[idx + k]
                                if "break" in next_line:
                                    has_break = True
                                    break
                                # If indentation drops, the loop has ended
                                if next_line.strip() and not next_line.startswith(line[:len(line) - len(line.lstrip())] + " "):
                                    break
                            
                            if not has_break:
                                issues.append({
                                    "file_path": rel_path,
                                    "line_number": line_num,
                                    "code_snippet": line.strip(),
                                    "title": "Potential Infinite Loop",
                                    "description": "A while loop with a constant condition (True/true) was detected without a clear 'break' expression inside its block. This can lead to CPU spikes and memory locks.",
                                    "severity": "critical",
                                    "category": "bug"
                                })

                        # Duplicate checks / Unused local imports (e.g. import statement, but keyword never used again)
                        if ext == ".py" and stripped.startswith("import ") or stripped.startswith("from "):
                            # extract import name
                            parts = stripped.split()
                            if len(parts) >= 2:
                                imp_name = parts[1].split(".")[0]
                                if len(parts) >= 4 and parts[2] == "as":
                                    imp_name = parts[3]
                                # Check if imp_name is referenced in file (count > 1 because it's in the import statement itself)
                                if content.count(imp_name) <= 1:
                                    issues.append({
                                        "file_path": rel_path,
                                        "line_number": line_num,
                                        "code_snippet": stripped,
                                        "title": f"Unused Import Reference: '{imp_name}'",
                                        "description": f"The module '{imp_name}' is imported but never referenced in the active code. This wastes memory resources and clutters imports list.",
                                        "severity": "low",
                                        "category": "bug"
                                    })
            except Exception as e:
                logger.error(f"Error scanning file {rel_path} for bugs: {e}")

        # 2. If LLM keys are configured, run an LLM-based bug assessment on the core files
        if self.openai_client or self.gemini_model:
            # Select first 3 primary source code files to scan (cap token expenses)
            code_files = [f for f in files_list if os.path.splitext(f)[1] in [".py", ".js", ".ts", ".tsx"]]
            for target_file in code_files[:3]:
                try:
                    full_path = os.path.join(project_path, target_file)
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        code_snippet = f.read()[:5000] # Limit file size sent
                    
                    system_message = (
                        "You are Bug Hunter, an elite code scanner. Detect syntax errors, logic bugs, dead code, "
                        "runtime risks, or import issues in the code. Return your analysis strictly as a JSON object "
                        "with an 'issues' key containing a list of objects. Each object must have: file_path, "
                        "line_number, code_snippet, title, description, severity ('critical'|'high'|'medium'|'low'), "
                        "and category ('bug')."
                    )
                    prompt = f"Analyze the following code from file '{target_file}':\n\n```\n{code_snippet}\n```"
                    
                    response_text = await self.call_llm(prompt, system_message, json_mode=True)
                    data = json.loads(response_text)
                    if "issues" in data:
                        for issue in data["issues"]:
                            # enforce correct file path
                            issue["file_path"] = target_file
                            issues.append(issue)
                except Exception as e:
                    logger.error(f"LLM scan failed for {target_file}: {e}")

        # If absolutely no issues found, append standard simulation items if it's a mock repository
        if not issues and not (self.openai_client or self.gemini_model):
            # Generate simulated mock bugs if scan yields empty results (e.g. workspace is empty or standard code has no issues)
            # Let's verify if there is at least one issue; otherwise add a default one.
            pass

        return issues
