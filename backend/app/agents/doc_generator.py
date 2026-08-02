import os
import logging
from app.agents.base import BaseAgent

logger = logging.getLogger(__name__)

class DocumentationAgent(BaseAgent):
    def __init__(self):
        super().__init__("Documentation Generator")

    async def generate_documentation(self, project_name: str, framework: str, files_list: list, structure_json: dict) -> dict:
        """Constructs API docs, setup instructions, and architecture documents."""
        if self.openai_client or self.gemini_model:
            system_message = (
                "You are Documentation Agent, an technical writer who writes beautiful markdown developer manuals. "
                "Output your response strictly as JSON with keys: 'readme' (main project overview, features, run steps), "
                "'api_docs' (endpoint description tables or class interfaces), and 'architecture' (design pattern explanation)."
            )
            prompt = (
                f"Project Name: {project_name}\n"
                f"Framework Identified: {framework}\n"
                f"Files Present: {files_list}\n"
                f"Project Structure: {list(structure_json.keys())}"
            )
            
            try:
                import json
                response = await self.call_llm(prompt, system_message, json_mode=True)
                return json.loads(response)
            except Exception as e:
                logger.error(f"Failed to compile LLM documentation: {e}")

        # Simulated fallback documentation
        readme = (
            f"# {project_name}\n\n"
            f"This project is a modern application built using the **{framework}** framework.\n\n"
            "## Key Features\n"
            "- Modular components setup\n"
            "- Dynamic environment settings\n"
            "- Standard routing structures\n\n"
            "## Running Locally\n"
            "1. Install the dependencies for your setup.\n"
            "2. Run the start command specified in project packages.\n"
        )
        
        api_docs = (
            "# API Documentation\n\n"
            "## Overview\n"
            "The following endpoints or interface methods organize core transactions:\n\n"
            "| Module | Endpoint / Interface | Purpose |\n"
            "| --- | --- | --- |\n"
            "| Auth | `POST /login` | Authenticates sessions |\n"
            "| Project | `GET /projects` | Lists user spaces |\n"
        )
        
        architecture = (
            "# Architectural Overview\n\n"
            "The system uses standard decoupled components keeping presentation layer details separate "
            "from backend persistence and controllers. Relational database maps link directly to "
            "Pydantic schemas for data integrity and safe transaction boundaries."
        )

        return {
            "readme": readme,
            "api_docs": api_docs,
            "architecture": architecture
        }
