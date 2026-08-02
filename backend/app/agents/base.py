import os
import json
import logging
from typing import Any, Dict, Optional, List
from openai import AsyncOpenAI
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

class BaseAgent:
    def __init__(self, name: str):
        self.name = name
        self.openai_client = None
        self.gemini_model = None
        
        # Initialize clients if keys are present
        if settings.OPENAI_API_KEY:
            self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.gemini_model = genai.GenerativeModel("gemini-1.5-flash")

    async def call_llm(self, prompt: str, system_message: str = "You are an expert AI software engineer.", json_mode: bool = False) -> str:
        """Call either OpenAI or Gemini depending on key configurations, with a fallback mock output if none exist."""
        if self.openai_client:
            try:
                response_format = {"type": "json_object"} if json_mode else None
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": prompt}
                    ],
                    response_format=response_format,
                    temperature=0.2
                )
                return response.choices[0].message.content or ""
            except Exception as e:
                logger.error(f"OpenAI API error in {self.name}: {e}. Falling back to mock response.")
                return self._get_mock_response(prompt, json_mode)

        elif self.gemini_model:
            try:
                # Gemini prompt with instructions inside
                full_prompt = f"{system_message}\n\nUser request:\n{prompt}"
                if json_mode:
                    full_prompt += "\n\nReturn the response strictly as valid JSON format."
                
                # Run synchronous call in thread pool if necessary, or simple call
                # google-generativeai supports async calls
                response = await self.gemini_model.generate_content_async(
                    full_prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.2,
                        response_mime_type="application/json" if json_mode else "text/plain"
                    )
                )
                return response.text or ""
            except Exception as e:
                logger.error(f"Gemini API error in {self.name}: {e}. Falling back to mock response.")
                return self._get_mock_response(prompt, json_mode)
        
        else:
            # Fallback to simulated/mock outputs if no API keys are provided
            logger.warning(f"No LLM API keys provided for {self.name}. Using mock fallback.")
            return self._get_mock_response(prompt, json_mode)

    def _get_mock_response(self, prompt: str, json_mode: bool) -> str:
        """Fallback mock generator for local testing/demo setups without LLM keys."""
        if not json_mode:
            return f"[Simulated Response from {self.name}]\nThis is a mock response because no OpenAI or Gemini keys were configured in the environment settings."
        
        # Build structured JSON replies depending on agent context inferred from prompt
        low_prompt = prompt.lower()
        if "bug" in low_prompt or "syntax" in low_prompt:
            return json.dumps({
                "issues": [
                    {
                        "file_path": "auth.py",
                        "line_number": 42,
                        "code_snippet": "def get_current_user(token: str):\n    payload = jwt.decode(token, secret_key)\n    return payload['user']",
                        "title": "Uncaught ExpiredSignatureError in JWT decryption",
                        "description": "The decode method can raise a jwt.ExpiredSignatureError when token expires, which will crash the endpoint instead of returning 401 Unauthorized credentials exception.",
                        "severity": "critical",
                        "category": "bug",
                        "why_happens": "JWT token expiration is checked natively by decode() but no try-except block wraps it, causing server crash on expired sessions.",
                        "original_code": "def get_current_user(token: str):\n    payload = jwt.decode(token, secret_key)\n    return payload['user']",
                        "fixed_code": "def get_current_user(token: str):\n    try:\n        payload = jwt.decode(token, secret_key, algorithms=['HS256'])\n        return payload.get('sub')\n    except jwt.PyJWTError:\n        raise HTTPException(status_code=401, detail='Could not validate credentials')",
                        "git_diff": "@@ -42,3 +42,6 @@\n def get_current_user(token: str):\n-    payload = jwt.decode(token, secret_key)\n-    return payload['user']\n+    try:\n+        payload = jwt.decode(token, secret_key, algorithms=['HS256'])\n+        return payload.get('sub')\n+    except jwt.PyJWTError:\n+        raise HTTPException(status_code=401, detail='Could not validate credentials')",
                        "test_code": "def test_get_current_user_expired():\n    with pytest.raises(HTTPException):\n        get_current_user('expired_token')"
                    },
                    {
                        "file_path": "db.py",
                        "line_number": 15,
                        "code_snippet": "def get_user_by_email(email: str):\n    return db.execute('SELECT * FROM users WHERE email = ' + email)",
                        "title": "SQL Injection vulnerability via raw string concatenation",
                        "description": "User email input is appended raw to the database SQL query command, letting malicious attackers alter logic statements.",
                        "severity": "high",
                        "category": "security",
                        "why_happens": "Database execution uses direct string concatenation instead of parameterized binding options, allowing raw input execution.",
                        "original_code": "def get_user_by_email(email: str):\n    return db.execute('SELECT * FROM users WHERE email = ' + email)",
                        "fixed_code": "def get_user_by_email(email: str):\n    return db.execute('SELECT * FROM users WHERE email = :email', {'email': email})",
                        "git_diff": "@@ -15,2 +15,2 @@\n def get_user_by_email(email: str):\n-    return db.execute('SELECT * FROM users WHERE email = ' + email)\n+    return db.execute('SELECT * FROM users WHERE email = :email', {'email': email})",
                        "test_code": "def test_get_user_by_email_sql_injection():\n    # Test with malicious payload\n    get_user_by_email(\"test@test.com' OR '1'='1\")"
                    }
                ]
            })
        
        elif "security" in low_prompt or "owasp" in low_prompt:
            return json.dumps({
                "issues": [
                    {
                        "file_path": "config.py",
                        "line_number": 8,
                        "code_snippet": "DATABASE_PASSWORD = \"admin_pass_12345\"",
                        "title": "Hardcoded database credentials in production configuration settings",
                        "description": "Highly sensitive configuration keys and passwords are typed inside code files, committing them to git trace history.",
                        "severity": "critical",
                        "category": "security",
                        "why_happens": "Secrets are written as literal Python variables instead of referencing process environment configurations.",
                        "original_code": "DATABASE_PASSWORD = \"admin_pass_12345\"",
                        "fixed_code": "import os\nDATABASE_PASSWORD = os.getenv('DATABASE_PASSWORD')",
                        "git_diff": "@@ -8,2 +8,3 @@\n-DATABASE_PASSWORD = \"admin_pass_12345\"\n+import os\n+DATABASE_PASSWORD = os.getenv('DATABASE_PASSWORD')",
                        "test_code": ""
                    }
                ]
            })
            
        elif "performance" in low_prompt or "loop" in low_prompt:
            return json.dumps({
                "issues": [
                    {
                        "file_path": "services.py",
                        "line_number": 110,
                        "code_snippet": "for project in projects:\n    owner = db.query(User).filter_by(id=project.owner_id).first()\n    print(owner.name)",
                        "title": "N+1 Query performance bottleneck",
                        "description": "Project owner database details are queried line-by-line inside a loop iteration instead of using joined table queries.",
                        "severity": "medium",
                        "category": "performance",
                        "why_happens": "Iterating through items fetches relational attributes separately, resulting in individual SQL network requests for every item.",
                        "original_code": "for project in projects:\n    owner = db.query(User).filter_by(id=project.owner_id).first()\n    print(owner.name)",
                        "fixed_code": "projects_with_owners = db.query(Project).options(joinedload(Project.owner)).all()\nfor project in projects_with_owners:\n    print(project.owner.name)",
                        "git_diff": "@@ -110,3 +110,3 @@\n-for project in projects:\n-    owner = db.query(User).filter_by(id=project.owner_id).first()\n-    print(owner.name)\n+projects_with_owners = db.query(Project).options(joinedload(Project.owner)).all()\n+for project in projects_with_owners:\n+    print(project.owner.name)",
                        "test_code": ""
                    }
                ]
            })
            
        elif "review" in low_prompt or "solid" in low_prompt:
            return json.dumps({
                "comments": [
                    {
                        "file_path": "manager.py",
                        "line_number": 12,
                        "comment": "This manager class handles user email creation, file upload parsing, AND logs database writing. This violates the Single Responsibility Principle (SRP). Refactor by extracting file parsing and database log utilities into distinct helper classes."
                    }
                ]
            })
            
        elif "readme" in low_prompt or "documentation" in low_prompt:
            return json.dumps({
                "readme": "# Simulated Project README\n\nGenerated automatically by Codex Detective.\n\n## Overview\nThis repository represents a standard modular web project setup.\n\n## Getting Started\n1. Install dependencies: `pip install -r requirements.txt`\n2. Run development: `uvicorn main:app --reload`",
                "api_docs": "# API Endpoints & Routes\n\n### Authentication\n- `POST /api/v1/auth/login`\n- `POST /api/v1/auth/register`",
                "architecture": "The repository is structured with modular design patterns, maintaining distinct database definitions, api handlers, utility scripts, and test classes."
            })
            
        else:
            return json.dumps({
                "summary": "Mock analysis summary output.",
                "overall_score": 85,
                "security_score": 90,
                "test_coverage_est": 65.4,
                "issues": []
            })
