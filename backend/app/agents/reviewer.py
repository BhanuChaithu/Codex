import os
import json
import logging
from app.agents.base import BaseAgent

logger = logging.getLogger(__name__)

class CodeReviewAgent(BaseAgent):
    def __init__(self):
        super().__init__("Code Reviewer")

    async def review_repository(self, project_path: str, files_list: list) -> list:
        """Analyzes readability, code complexity, and design pattern violations across project files."""
        comments = []
        
        # 1. Static rule assertions
        for rel_path in files_list:
            full_path = os.path.join(project_path, rel_path)
            if not os.path.isfile(full_path) or os.path.getsize(full_path) > 300 * 1024:
                continue
                
            ext = os.path.splitext(rel_path)[1].lower()
            if ext not in [".py", ".js", ".ts", ".tsx"]:
                continue
                
            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.readlines()
                    
                    for idx, line in enumerate(lines):
                        line_num = idx + 1
                        stripped = line.strip()
                        
                        # Check for extremely complex methods (e.g. nested conditions)
                        if stripped.count(" if ") >= 3 or stripped.count(" && ") >= 3 or stripped.count(" and ") >= 3:
                            comments.append({
                                "file_path": rel_path,
                                "line_number": line_num,
                                "comment": "High cognitive complexity detected. This condition combines multiple conditional tests. Refactor by extracting to descriptive helper methods or breaking them down to simplify reading."
                            })
                        
                        # Check for massive classes
                        if (stripped.startswith("class ") and 
                            len(lines) > 300):
                            comments.append({
                                "file_path": rel_path,
                                "line_number": line_num,
                                "comment": f"This class contains over 300 lines of code. This might indicate that it is accumulating too many responsibilities, violating the Single Responsibility Principle. Consider refactoring and breaking it down into smaller, specialized helper files."
                            })
            except Exception as e:
                logger.error(f"Error scanning code reviews in {rel_path}: {e}")

        # 2. LLM review comments creation
        if self.openai_client or self.gemini_model:
            code_files = [f for f in files_list if os.path.splitext(f)[1] in [".py", ".js", ".ts", ".tsx"]]
            for target_file in code_files[:2]:  # Cap LLM reviews to keep processing quick
                try:
                    full_path = os.path.join(project_path, target_file)
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        code_snippet = f.read()[:5000]
                    
                    system_message = (
                        "You are Code Review Agent, an demanding tech lead review engineer. "
                        "Read the code and output review notes on complexity, readability, SOLID architecture, or code smells. "
                        "Return your report strictly as a JSON object with a 'comments' key containing a list. "
                        "Each item must have: file_path, line_number, and comment."
                    )
                    prompt = f"Perform a code review of file '{target_file}':\n\n```\n{code_snippet}\n```"
                    
                    response_text = await self.call_llm(prompt, system_message, json_mode=True)
                    data = json.loads(response_text)
                    if "comments" in data:
                        for comment in data["comments"]:
                            comment["file_path"] = target_file
                            comments.append(comment)
                except Exception as e:
                    logger.error(f"LLM code review failed for {target_file}: {e}")
                    
        return comments
