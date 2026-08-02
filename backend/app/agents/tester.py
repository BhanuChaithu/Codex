import os
import logging
from app.agents.base import BaseAgent

logger = logging.getLogger(__name__)

class TestGeneratorAgent(BaseAgent):
    def __init__(self):
        super().__init__("Test Generator")

    async def generate_tests(self, file_path: str, code_content: str, language: str) -> dict:
        """Constructs test suite templates based on file content and language type."""
        if self.openai_client or self.gemini_model:
            system_message = (
                "You are Test Generator Agent, a QA engineer specializing in writing unit tests. "
                "Write a complete, executable unit test suite using the appropriate framework (pytest for Python, "
                "Jest for JavaScript/TypeScript, JUnit for Java). Return strictly a JSON object with keys: "
                "'test_code' (the test source code string) and 'framework' (pytest|jest|junit)."
            )
            prompt = (
                f"File Path: {file_path}\n"
                f"Language: {language}\n"
                f"Code Content:\n```\n{code_content[:4000]}\n```"
            )
            
            try:
                import json
                response = await self.call_llm(prompt, system_message, json_mode=True)
                data = json.loads(response)
                return {
                    "test_code": data.get("test_code", ""),
                    "framework": data.get("framework", "pytest" if language == "Python" else "jest")
                }
            except Exception as e:
                logger.error(f"Failed to generate LLM tests: {e}")

        # Fallback unit test template creation
        test_code = ""
        framework = "pytest"
        
        if language == "Python":
            framework = "pytest"
            test_code = (
                "import pytest\n"
                f"# Tests for {os.path.basename(file_path)}\n\n"
                "def test_success_case():\n"
                "    # TODO: Implement success test scenario\n"
                "    assert True\n\n"
                "def test_failure_case():\n"
                "    # TODO: Implement edge cases or failure testing\n"
                "    with pytest.raises(Exception):\n"
                "        raise ValueError('Invalid inputs')\n"
            )
        else:
            framework = "jest"
            test_code = (
                f"// Tests for {os.path.basename(file_path)}\n"
                "describe('Module Tests', () => {\n"
                "  test('should verify basic functionality', () => {\n"
                "    expect(true).toBe(true);\n"
                "  });\n\n"
                "  test('should handle invalid input boundaries', () => {\n"
                "    expect(() => {\n"
                "      throw new Error('Invalid query');\n"
                "    }).toThrow();\n"
                "  });\n"
                "});\n"
            )

        return {
            "test_code": test_code,
            "framework": framework
        }
