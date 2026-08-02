import os
import re
import json
import logging
from app.agents.base import BaseAgent

logger = logging.getLogger(__name__)

class SecurityAgent(BaseAgent):
    def __init__(self):
        super().__init__("Security Scanner")

    async def scan_repository(self, project_path: str, files_list: list) -> list:
        """Inspects source files for vulnerabilities like hardcoded credentials and SQL injections."""
        issues = []
        
        # 1. Regex static scanning rules
        secret_patterns = [
            (r"(?i)(api_key|apikey|secret|password|passwd|private_key|token)\s*=\s*['\"][a-zA-Z0-9_\-\.\/]{12,}['\"]", "Exposed Secret / API Key Credentials"),
            (r"(?i)(aws_access_key_id|aws_secret_access_key|client_secret|client_id)\s*=\s*['\"][a-zA-Z0-9_\-\.\/]{10,}['\"]", "Exposed AWS / OAuth Cloud Secrets")
        ]
        
        sql_injection_patterns = [
            (r"(?i)\.execute\(\s*['\"].*?SELECT.*?WHERE.*?\+\s*\w+", "Possible SQL Injection via raw string concatenation"),
            (r"(?i)\.execute\(\s*f['\"].*?SELECT.*?WHERE.*?\{\w+\}", "Possible SQL Injection via string f-interpolation")
        ]
        
        xss_patterns = [
            (r"dangerouslySetInnerHTML\s*=\s*\{\{\s*__html\s*:", "Direct usage of raw HTML injection (dangerouslySetInnerHTML)"),
            (r"innerHTML\s*=", "Raw innerHTML injection vulnerability")
        ]

        for rel_path in files_list:
            full_path = os.path.join(project_path, rel_path)
            if not os.path.isfile(full_path) or os.path.getsize(full_path) > 500 * 1024:
                continue
                
            ext = os.path.splitext(rel_path)[1].lower()
            
            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.readlines()
                    
                    for idx, line in enumerate(lines):
                        line_num = idx + 1
                        stripped = line.strip()
                        
                        # Test for exposed secrets
                        for pattern, title in secret_patterns:
                            if re.search(pattern, line) and not "os.environ" in line and not "getenv" in line:
                                issues.append({
                                    "file_path": rel_path,
                                    "line_number": line_num,
                                    "code_snippet": stripped,
                                    "title": title,
                                    "description": "A hardcoded secret, token, or credential was found. This can lead to account hijacking or API abuse if exposed to Git history or unauthorized access.",
                                    "severity": "critical",
                                    "category": "security"
                                })
                                break # match found
                        
                        # Test for SQL Injections (primarily python/node db executes)
                        for pattern, title in sql_injection_patterns:
                            if re.search(pattern, line):
                                issues.append({
                                    "file_path": rel_path,
                                    "line_number": line_num,
                                    "code_snippet": stripped,
                                    "title": title,
                                    "description": "Raw string inputs are bound to SQL executions without parameter bindings. This permits attackers to run arbitrary DB instructions.",
                                    "severity": "high",
                                    "category": "security"
                                })
                                break
                        
                        # Test for React XSS risks
                        for pattern, title in xss_patterns:
                            if re.search(pattern, line):
                                issues.append({
                                    "file_path": rel_path,
                                    "line_number": line_num,
                                    "code_snippet": stripped,
                                    "title": title,
                                    "description": "Injecting user inputs directly into HTML nodes bypasses standard DOM encoding, introducing Cross-Site Scripting (XSS) issues.",
                                    "severity": "high",
                                    "category": "security"
                                })
                                break

            except Exception as e:
                logger.error(f"Error scanning security in {rel_path}: {e}")

        # 2. Use LLM security scans if configured
        if self.openai_client or self.gemini_model:
            code_files = [f for f in files_list if os.path.splitext(f)[1] in [".py", ".js", ".ts", ".tsx"]]
            for target_file in code_files[:3]:
                try:
                    full_path = os.path.join(project_path, target_file)
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        code_snippet = f.read()[:5000]
                    
                    system_message = (
                        "You are Security Agent, a top-tier security researcher. Scan the code for secrets, "
                        "SQL injection, XSS, CSRF, insecure libraries, or broken access controls. "
                        "Return your findings strictly as a JSON object with an 'issues' key containing a list. "
                        "Each item must have: file_path, line_number, code_snippet, title, description, "
                        "severity ('critical'|'high'|'medium'|'low'), and category ('security')."
                    )
                    prompt = f"Analyze the security of the following file '{target_file}':\n\n```\n{code_snippet}\n```"
                    
                    response_text = await self.call_llm(prompt, system_message, json_mode=True)
                    data = json.loads(response_text)
                    if "issues" in data:
                        for issue in data["issues"]:
                            issue["file_path"] = target_file
                            issues.append(issue)
                except Exception as e:
                    logger.error(f"LLM security scan failed for {target_file}: {e}")

        return issues
