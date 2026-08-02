import os
import re
import json
import logging
from app.agents.base import BaseAgent

logger = logging.getLogger(__name__)

class PerformanceAgent(BaseAgent):
    def __init__(self):
        super().__init__("Performance Inspector")

    async def scan_repository(self, project_path: str, files_list: list) -> list:
        """Analyzes files for nested loops, N+1 query structures, and blocking system execution."""
        issues = []
        
        for rel_path in files_list:
            full_path = os.path.join(project_path, rel_path)
            if not os.path.isfile(full_path) or os.path.getsize(full_path) > 500 * 1024:
                continue
                
            ext = os.path.splitext(rel_path)[1].lower()
            if ext not in [".py", ".js", ".ts", ".tsx"]:
                continue
                
            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.readlines()
                    
                    # Detect nested loops (e.g. tracking indentation of for/while statements)
                    loop_indentations = []
                    
                    for idx, line in enumerate(lines):
                        line_num = idx + 1
                        stripped = line.strip()
                        
                        # Calculate indentation (leading whitespace)
                        indent = len(line) - len(line.lstrip())
                        
                        # clean list of completed loops
                        loop_indentations = [i for i in loop_indentations if i < indent]
                        
                        is_loop = False
                        if ext == ".py":
                            if stripped.startswith("for ") or stripped.startswith("while "):
                                is_loop = True
                        elif ext in [".js", ".ts", ".tsx"]:
                            if (stripped.startswith("for ") or stripped.startswith("while ") or 
                                ".forEach(" in stripped or ".map(" in stripped):
                                is_loop = True
                                
                        if is_loop:
                            loop_indentations.append(indent)
                            if len(loop_indentations) >= 3:
                                issues.append({
                                    "file_path": rel_path,
                                    "line_number": line_num,
                                    "code_snippet": stripped,
                                    "title": "Deeply Nested Loops",
                                    "description": f"Detected loop nesting levels >= 3 (depth {len(loop_indentations)}). This can scale to quadratic O(N^2/N^3) execution costs for large datasets.",
                                    "severity": "medium",
                                    "category": "performance"
                                })
                        
                        # Detect potential sync block in async function (Python specific)
                        if ext == ".py" and "time.sleep(" in stripped:
                            # Verify if we are inside an async function
                            # Look back 20 lines to see if 'async def' was declared
                            is_async_context = False
                            for k in range(1, min(20, idx)):
                                prev_line = lines[idx - k]
                                if "async def " in prev_line:
                                    is_async_context = True
                                    break
                            
                            if is_async_context:
                                issues.append({
                                    "file_path": rel_path,
                                    "line_number": line_num,
                                    "code_snippet": stripped,
                                    "title": "Synchronous Blocking sleep inside Async Def context",
                                    "description": "Using blocking 'time.sleep' locks the single-threaded asyncio event loop, halting the execution of all other concurrent requests. Replace with 'await asyncio.sleep(...)'.",
                                    "severity": "high",
                                    "category": "performance"
                                })
            except Exception as e:
                logger.error(f"Error scanning performance in {rel_path}: {e}")

        # 2. Use LLM performance scans if configured
        if self.openai_client or self.gemini_model:
            code_files = [f for f in files_list if os.path.splitext(f)[1] in [".py", ".js", ".ts", ".tsx"]]
            for target_file in code_files[:3]:
                try:
                    full_path = os.path.join(project_path, target_file)
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        code_snippet = f.read()[:5000]
                    
                    system_message = (
                        "You are Performance Agent, an elite optimization expert. Scan the code for "
                        "bottlenecks, recursive traps, sync blocks in async contexts, N+1 queries, or heavy allocations. "
                        "Return your findings strictly as a JSON object with an 'issues' key containing a list. "
                        "Each item must have: file_path, line_number, code_snippet, title, description, "
                        "severity ('critical'|'high'|'medium'|'low'), and category ('performance')."
                    )
                    prompt = f"Analyze the performance bottlenecks of code in '{target_file}':\n\n```\n{code_snippet}\n```"
                    
                    response_text = await self.call_llm(prompt, system_message, json_mode=True)
                    data = json.loads(response_text)
                    if "issues" in data:
                        for issue in data["issues"]:
                            issue["file_path"] = target_file
                            issues.append(issue)
                except Exception as e:
                    logger.error(f"LLM performance scan failed for {target_file}: {e}")

        return issues
