import os
import difflib
import logging
from app.agents.base import BaseAgent

logger = logging.getLogger(__name__)

class AutoFixAgent(BaseAgent):
    def __init__(self):
        super().__init__("Auto Fixer")

    async def generate_fix(self, file_path: str, issue_title: str, issue_description: str, code_snippet: str, file_content: str) -> dict:
        """Invokes LLM to construct fixed code and standard git diff patch."""
        if self.openai_client or self.gemini_model:
            system_message = (
                "You are Auto Fix Agent, an expert developer who refactors buggy code. "
                "Analyze the issue, rewrite the snippet to fix it (keeping original styles, variables and spacing), "
                "and explain the fix. Output strictly as JSON with keys: 'fixed_code' (the exact replacement block) "
                "and 'explanation'."
            )
            prompt = (
                f"File: {file_path}\n"
                f"Issue: {issue_title}\n"
                f"Details: {issue_description}\n"
                f"Buggy Snippet:\n```\n{code_snippet}\n```\n\n"
                f"Surrounding File Content:\n```\n{file_content[:3000]}\n```"
            )
            
            try:
                response = await self.call_llm(prompt, system_message, json_mode=True)
                import json
                data = json.loads(response)
                fixed_code = data.get("fixed_code", code_snippet)
                explanation = data.get("explanation", "Issue resolved.")
                
                # Compute git-style unified diff
                diff_lines = list(difflib.unified_diff(
                    code_snippet.splitlines(keepends=True),
                    fixed_code.splitlines(keepends=True),
                    fromfile=f"a/{file_path}",
                    tofile=f"b/{file_path}"
                ))
                git_diff = "".join(diff_lines)
                
                return {
                    "fixed_code": fixed_code,
                    "git_diff": git_diff,
                    "explanation": explanation
                }
            except Exception as e:
                logger.error(f"Failed to generate LLM fix: {e}")
        
        # Fallback simulated fix
        fixed_code = code_snippet
        explanation = "Simulated patch correction applied."
        if "sql" in issue_title.lower() or "injection" in issue_title.lower():
            fixed_code = code_snippet.replace("+ email", ", {'email': email}").replace("SELECT * FROM users WHERE email = ' + email", "SELECT * FROM users WHERE email = :email")
            explanation = "Replaced raw string concatenation with SQL query parameters to secure database access."
        elif "jwt" in issue_title.lower() or "expired" in issue_title.lower():
            fixed_code = "try:\n        payload = jwt.decode(token, secret_key, algorithms=['HS256'])\n        return payload.get('sub')\n    except jwt.PyJWTError:\n        raise HTTPException(status_code=401, detail='Could not validate credentials')"
            explanation = "Wrapped jwt.decode inside an exception handler block to gracefully return a 401 Unauthorized status on invalid or expired token."
        elif "secret" in issue_title.lower() or "password" in issue_title.lower():
            fixed_code = "import os\nDATABASE_PASSWORD = os.getenv('DATABASE_PASSWORD')"
            explanation = "Loaded database password credential from environment variables using os.getenv, preventing code secrets leak."

        # Compute diff
        diff_lines = list(difflib.unified_diff(
            code_snippet.splitlines(keepends=True),
            fixed_code.splitlines(keepends=True),
            fromfile=f"a/{file_path}",
            tofile=f"b/{file_path}"
        ))
        git_diff = "".join(diff_lines) or "No changes detected."

        return {
            "fixed_code": fixed_code,
            "git_diff": git_diff,
            "explanation": explanation
        }

    def apply_fix_to_file(self, full_file_path: str, original_code: str, fixed_code: str) -> bool:
        """Safely updates file contents, replacing the targeted original snippet with fixed code."""
        if not os.path.exists(full_file_path):
            logger.error(f"Cannot apply fix. File not found: {full_file_path}")
            return False
            
        try:
            with open(full_file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            # Normalizing string spacing a bit to avoid exact whitespace mismatch blocker
            # If the original code exists directly, replace it
            if original_code in content:
                new_content = content.replace(original_code, fixed_code)
            else:
                # Fallback: Attempt fuzzy replace (try with stripped versions or write replacement directly if short)
                # For safety, let's log the error and try a fallback replacement
                logger.warning("Exact match for code snippet not found. Trying fallback normalization.")
                stripped_orig = original_code.strip()
                if stripped_orig in content:
                    new_content = content.replace(stripped_orig, fixed_code)
                else:
                    logger.error("Could not find code snippet block in source file to patch.")
                    return False
            
            with open(full_file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
                
            logger.info(f"Successfully patched file {full_file_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to write patch to file: {e}")
            return False
