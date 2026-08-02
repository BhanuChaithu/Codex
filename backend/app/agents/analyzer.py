import os
import re
import json
import logging
from git import Repo
from app.agents.base import BaseAgent

logger = logging.getLogger(__name__)

class RepositoryAnalyzerAgent(BaseAgent):
    def __init__(self):
        super().__init__("Repository Analyzer")

    def clone_repo(self, repo_url: str, destination: str, branch: str = "main") -> str:
        """Clones the repository and returns target path."""
        logger.info(f"Cloning repository {repo_url} into {destination}...")
        try:
            Repo.clone_from(repo_url, destination, branch=branch)
            logger.info("Cloning complete.")
            return destination
        except Exception as e:
            logger.warning(f"Failed to clone on branch {branch}, attempting default branch clone: {e}")
            Repo.clone_from(repo_url, destination)
            return destination

    def analyze_directory(self, path: str) -> dict:
        """Walks the folder tree to determine stats, languages, files structures, and imports."""
        total_files = 0
        total_loc = 0
        file_tree = {}
        languages_loc = {}
        dependencies = {}
        imports_map = {} # file_path -> list of imports
        
        ignored_dirs = {".git", "node_modules", "venv", "__pycache__", "dist", "build", ".next", ".gemini"}
        ignored_files = {".DS_Store", "package-lock.json", "poetry.lock", "yarn.lock"}
        
        # Mapping extensions to human languages
        ext_map = {
            ".py": "Python",
            ".js": "JavaScript",
            ".ts": "TypeScript",
            ".tsx": "React TypeScript",
            ".jsx": "React JavaScript",
            ".html": "HTML",
            ".css": "CSS",
            ".json": "JSON",
            ".go": "Go",
            ".java": "Java",
            ".cpp": "C++",
            ".c": "C",
            ".php": "PHP",
            ".rb": "Ruby",
            ".sh": "Shell Script",
            ".md": "Markdown",
            ".yml": "YAML",
            ".yaml": "YAML"
        }

        # Walk the directory
        for root, dirs, files in os.walk(path):
            # Prune directory walk in-place
            dirs[:] = [d for d in dirs if d not in ignored_dirs]
            
            for file in files:
                if file in ignored_files:
                    continue
                
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, path).replace("\\", "/")
                
                # Exclude symlinks or files that can't be read
                if os.path.islink(full_path):
                    continue
                
                try:
                    size = os.path.getsize(full_path)
                except OSError:
                    continue
                
                ext = os.path.splitext(file)[1].lower()
                lang = ext_map.get(ext, "Unknown")
                
                # Read content for lines of code (LOC) and imports
                loc = 0
                file_imports = []
                
                if lang != "Unknown" and lang != "JSON" and size < 2 * 1024 * 1024:  # Avoid parsing large binary/config files
                    try:
                        with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                            lines = f.readlines()
                            loc = len(lines)
                            
                            # Parse imports for Python/JS/TS simple regex dependency mapping
                            for line in lines:
                                if lang == "Python":
                                    # e.g., import os, from django.db import models
                                    match = re.match(r"^\s*(?:import|from)\s+([a-zA-Z0-9_\.]+)", line)
                                    if match:
                                        file_imports.append(match.group(1).split(".")[0])
                                elif lang in ["JavaScript", "TypeScript", "React JavaScript", "React TypeScript"]:
                                    # e.g., import React from 'react', import { x } from './y'
                                    match = re.search(r"from\s+['\"]([^'\"]+)['\"]", line)
                                    if match:
                                        file_imports.append(match.group(1))
                    except Exception as e:
                        logger.warning(f"Error reading file {full_path}: {e}")
                
                total_files += 1
                total_loc += loc
                
                if lang != "Unknown" and loc > 0:
                    languages_loc[lang] = languages_loc.get(lang, 0) + loc
                
                # Add to tree
                parts = rel_path.split("/")
                current = file_tree
                for part in parts[:-1]:
                    if part not in current:
                        current[part] = {}
                    current = current[part]
                current[parts[-1]] = {
                    "type": "file",
                    "size": size,
                    "loc": loc,
                    "language": lang
                }
                
                if file_imports:
                    imports_map[rel_path] = list(set(file_imports))

        # Normalize languages percentage
        languages_pct = {}
        total_lang_loc = sum(languages_loc.values())
        if total_lang_loc > 0:
            for lang, count in languages_loc.items():
                languages_pct[lang] = round((count / total_lang_loc) * 100, 2)
        else:
            languages_pct = {"Unknown": 100.0}

        # Detect core framework
        framework = "Vanilla / Unknown"
        if "package.json" in os.listdir(path) if os.path.exists(os.path.join(path, "package.json")) else False:
            try:
                with open(os.path.join(path, "package.json"), "r") as f:
                    pkg = json.load(f)
                    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
                    if "next" in deps:
                        framework = "Next.js"
                    elif "react" in deps:
                        framework = "React"
                    elif "express" in deps:
                        framework = "Express"
                    elif "vue" in deps:
                        framework = "Vue"
            except Exception:
                pass
        
        # Check python frameworks
        for file in os.listdir(path) if os.path.exists(path) else []:
            if file == "manage.py":
                framework = "Django"
                break
            elif file in ["requirements.txt", "Pipfile", "pyproject.toml"]:
                try:
                    with open(os.path.join(path, file), "r", errors="ignore") as f:
                        content = f.read()
                        if "fastapi" in content.lower():
                            framework = "FastAPI"
                        elif "flask" in content.lower():
                            framework = "Flask"
                        elif "django" in content.lower():
                            framework = "Django"
                except Exception:
                    pass

        # Generate simplified dependency graph
        # Node format: { id: "path", group: "folder" }
        # Link format: { source: "a", target: "b" }
        nodes = []
        links = []
        
        # Flatten tree into simple list of files for graph nodes
        flat_files = list(imports_map.keys())
        for f in flat_files:
            nodes.append({"id": f, "group": os.path.dirname(f) or "root"})
            
            # Form link targets
            for imp in imports_map[f]:
                # Attempt to resolve relative import target matches
                for candidate in flat_files:
                    cand_base = os.path.splitext(os.path.basename(candidate))[0]
                    if cand_base == imp or (imp.startswith(".") and os.path.normpath(os.path.join(os.path.dirname(f), imp)) in candidate):
                        links.append({"source": f, "target": candidate})
                        break

        # Architecture type detection
        architecture = "Monolithic Structure"
        if any(d in os.listdir(path) for d in ["src", "app", "components"]):
            architecture = "Layered Architecture (Frontend / Monorepo)"
        if "docker-compose.yml" in os.listdir(path) or len([d for d in os.listdir(path) if os.path.isdir(os.path.join(path, d)) and "requirements.txt" in os.listdir(os.path.join(path, d))]) > 1:
            architecture = "Microservices / Containerized Services"

        return {
            "size_bytes": sum(os.path.getsize(os.path.join(root, f)) for root, _, files in os.walk(path) for f in files if not os.path.islink(os.path.join(root, f))),
            "file_count": total_files,
            "lines_of_code": total_loc,
            "languages": languages_pct,
            "framework": framework,
            "architecture_type": architecture,
            "file_tree": file_tree,
            "dependency_graph": {
                "nodes": nodes[:50],  # cap nodes for rendering safety
                "links": links[:100]
            }
        }
