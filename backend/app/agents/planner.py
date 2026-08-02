import os
import json
import logging
import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.models import Project, Repository, Issue, Fix, Report, Log
from app.agents.analyzer import RepositoryAnalyzerAgent
from app.agents.bug_hunter import BugHunterAgent
from app.agents.security import SecurityAgent
from app.agents.performance import PerformanceAgent
from app.agents.autofix import AutoFixAgent
from app.agents.tester import TestGeneratorAgent
from app.agents.reviewer import CodeReviewAgent
from app.agents.doc_generator import DocumentationAgent
from app.core.config import settings

logger = logging.getLogger(__name__)

# WebSocket Active Connections pool (registered globally)
active_sockets = {} # project_id -> list of web sockets

async def broadcast_progress(project_id: int, agent_name: str, status: str, percentage: int, message: str):
    """Utility to alert all active web-socket listeners for a project."""
    payload = {
        "project_id": project_id,
        "agent_name": agent_name,
        "status": status,
        "percentage": percentage,
        "message": message,
        "timestamp": datetime.utcnow().timestamp()
    }
    logger.info(f"[Progress {percentage}%] {agent_name}: {message}")
    
    sockets = active_sockets.get(project_id, [])
    for websocket in list(sockets):
        try:
            await websocket.send_text(json.dumps(payload))
        except Exception:
            try:
                sockets.remove(websocket)
            except ValueError:
                pass

class AIPlanner:
    def __init__(self, db: AsyncSession):
        self.db = db
        
        # Instantiate agents
        self.analyzer = RepositoryAnalyzerAgent()
        self.bug_hunter = BugHunterAgent()
        self.security = SecurityAgent()
        self.performance = PerformanceAgent()
        self.autofix = AutoFixAgent()
        self.tester = TestGeneratorAgent()
        self.reviewer = CodeReviewAgent()
        self.doc_generator = DocumentationAgent()

    async def log_agent_activity(self, project_id: int, agent_name: str, level: str, message: str, details: str = None):
        """Saves agent log records directly to the database."""
        db_log = Log(
            project_id=project_id,
            agent_name=agent_name,
            level=level,
            message=message,
            details=details
        )
        self.db.add(db_log)
        await self.db.commit()

    async def execute_workflow(self, project_id: int):
        """Executes the full multi-agent cascade in the background."""
        logger.info(f"Starting agent pipeline workflow for project {project_id}")
        
        # 1. Fetch project info
        result = await self.db.execute(select(Project).where(Project.id == project_id))
        project = result.scalar_one_or_none()
        if not project:
            logger.error(f"Project {project_id} not found in database.")
            return

        try:
            project.status = "analyzing"
            await self.db.commit()
            
            # Step 1: Repository Analyzer Agent
            await broadcast_progress(project_id, "Repository Analyzer", "running", 10, "Scanning folder contents and computing LOC statistics...")
            await self.log_agent_activity(project_id, "Repository Analyzer", "info", "Starting folder structural analysis.")
            
            repo_result = await self.db.execute(select(Repository).where(Repository.project_id == project_id))
            repository = repo_result.scalar_one_or_none()
            if not repository:
                raise Exception("No repository settings mapped to project.")

            # Analyze files recursively
            repo_stats = self.analyzer.analyze_directory(repository.local_path)
            
            # Update repository stats
            repository.size_bytes = repo_stats["size_bytes"]
            repository.file_count = repo_stats["file_count"]
            repository.lines_of_code = repo_stats["lines_of_code"]
            repository.languages = repo_stats["languages"]
            repository.framework = repo_stats["framework"]
            repository.architecture_type = repo_stats["architecture_type"]
            repository.dependency_graph_json = repo_stats["dependency_graph"]
            await self.db.commit()
            
            await self.log_agent_activity(
                project_id, "Repository Analyzer", "info", 
                f"Repository parsed. Languages: {list(repo_stats['languages'].keys())}, Framework: {repo_stats['framework']}"
            )
            
            # Get flat files list for scanning (exclude standard third-party dirs)
            flat_files = []
            for root, dirs, files in os.walk(repository.local_path):
                dirs[:] = [d for d in dirs if d not in {".git", "node_modules", "venv", "__pycache__", "dist", "build", ".next"}]
                for file in files:
                    if os.path.splitext(file)[1].lower() in [".py", ".js", ".ts", ".tsx", ".jsx", ".html", ".css"]:
                        flat_files.append(os.path.relpath(os.path.join(root, file), repository.local_path).replace("\\", "/"))
            
            # Step 2: Bug Hunter Agent
            await broadcast_progress(project_id, "Bug Hunter", "running", 30, "Scanning files for syntax issues and logical traps...")
            await self.log_agent_activity(project_id, "Bug Hunter", "info", f"Scanning {len(flat_files)} code files for logic flaws.")
            
            bugs = await self.bug_hunter.scan_repository(repository.local_path, flat_files)
            for bug in bugs:
                db_issue = Issue(
                    project_id=project_id,
                    file_path=bug["file_path"],
                    line_number=bug["line_number"],
                    code_snippet=bug["code_snippet"],
                    title=bug["title"],
                    description=bug["description"],
                    severity=bug["severity"],
                    category="bug"
                )
                self.db.add(db_issue)
            await self.db.commit()
            await self.log_agent_activity(project_id, "Bug Hunter", "info", f"Found {len(bugs)} logical code errors.")

            # Step 3: Security Agent
            await broadcast_progress(project_id, "Security Agent", "running", 50, "Evaluating OWASP vulnerability vectors and secrets exposure...")
            await self.log_agent_activity(project_id, "Security Agent", "info", "Evaluating OWASP rules and credentials safety.")
            
            sec_issues = await self.security.scan_repository(repository.local_path, flat_files)
            for issue in sec_issues:
                db_issue = Issue(
                    project_id=project_id,
                    file_path=issue["file_path"],
                    line_number=issue["line_number"],
                    code_snippet=issue["code_snippet"],
                    title=issue["title"],
                    description=issue["description"],
                    severity=issue["severity"],
                    category="security"
                )
                self.db.add(db_issue)
            await self.db.commit()
            await self.log_agent_activity(project_id, "Security Agent", "info", f"Detected {len(sec_issues)} security vulnerabilities.")

            # Step 4: Performance Agent
            await broadcast_progress(project_id, "Performance Agent", "running", 70, "Scanning loops nested structures and database operations bottlenecks...")
            await self.log_agent_activity(project_id, "Performance Agent", "info", "Searching for database blockages and loops complexity.")
            
            perf_issues = await self.performance.scan_repository(repository.local_path, flat_files)
            for issue in perf_issues:
                db_issue = Issue(
                    project_id=project_id,
                    file_path=issue["file_path"],
                    line_number=issue["line_number"],
                    code_snippet=issue["code_snippet"],
                    title=issue["title"],
                    description=issue["description"],
                    severity=issue["severity"],
                    category="performance"
                )
                self.db.add(db_issue)
            await self.db.commit()
            await self.log_agent_activity(project_id, "Performance Agent", "info", f"Found {len(perf_issues)} performance bottlenecks.")

            # Step 5: Code Review Agent
            await broadcast_progress(project_id, "Code Reviewer", "running", 80, "Reviewing SOLID formatting and maintainability smells...")
            await self.log_agent_activity(project_id, "Code Reviewer", "info", "Validating code quality standards.")
            
            review_comments = await self.reviewer.review_repository(repository.local_path, flat_files)
            for comment in review_comments:
                db_issue = Issue(
                    project_id=project_id,
                    file_path=comment["file_path"],
                    line_number=comment["line_number"],
                    code_snippet=None,
                    title="Code Smell / Refactoring Suggestion",
                    description=comment["comment"],
                    severity="low",
                    category="code_review"
                )
                self.db.add(db_issue)
            await self.db.commit()

            # Step 6: Auto Fix Agent
            await broadcast_progress(project_id, "Auto Fixer", "running", 85, "Generating code patches for critical issues...")
            # Query all critical or high issues we just inserted
            issues_result = await self.db.execute(
                select(Issue).where(Issue.project_id == project_id, Issue.severity.in_(["critical", "high"]))
            )
            unfixed_issues = issues_result.scalars().all()
            for issue in unfixed_issues:
                if not issue.code_snippet:
                    continue
                # Retrieve surrounding file contents
                full_path = os.path.join(repository.local_path, issue.file_path)
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        file_content = f.read()
                except Exception:
                    file_content = issue.code_snippet

                fix_details = await self.autofix.generate_fix(
                    issue.file_path, issue.title, issue.description, issue.code_snippet, file_content
                )
                db_fix = Fix(
                    issue_id=issue.id,
                    original_code=issue.code_snippet,
                    fixed_code=fix_details["fixed_code"],
                    git_diff=fix_details["git_diff"]
                )
                self.db.add(db_fix)
            await self.db.commit()

            # Step 7: Documentation & Test Generation
            await broadcast_progress(project_id, "Documentation & QA", "running", 90, "Writing installation readme and testing suite configurations...")
            
            # Select first file for generating unit tests
            primary_file = flat_files[0] if flat_files else "main.py"
            primary_content = ""
            if flat_files:
                try:
                    with open(os.path.join(repository.local_path, primary_file), "r", errors="ignore") as f:
                        primary_content = f.read()
                except Exception:
                    pass
            
            test_info = await self.tester.generate_tests(
                primary_file, primary_content, "Python" if repository.framework in ["FastAPI", "Django", "Flask"] else "JavaScript"
            )
            
            doc_info = await self.doc_generator.generate_documentation(
                project.name, repository.framework or "Python/JS", flat_files[:15], repo_stats["file_tree"]
            )

            # Step 8: Build Report & Scores
            all_issues_result = await self.db.execute(select(Issue).where(Issue.project_id == project_id))
            all_issues = all_issues_result.scalars().all()
            
            # Calculate Scores
            # Deduct points for each issue based on severity
            base_score = 100
            security_score = 100
            for iss in all_issues:
                severity_deduct = {"critical": 15, "high": 10, "medium": 5, "low": 2}.get(iss.severity, 2)
                base_score -= severity_deduct
                if iss.category == "security":
                    security_score -= severity_deduct
                    
            overall_score = max(10, min(100, base_score))
            security_score = max(10, min(100, security_score))
            
            # Formulate architectural review text
            arch_notes = doc_info.get("architecture", "")
            summary = (
                f"Multi-agent review successfully compiled for {project.name}. "
                f"Detected {len([i for i in all_issues if i.category == 'bug'])} bugs, "
                f"{len([i for i in all_issues if i.category == 'security'])} security concerns, and "
                f"{len([i for i in all_issues if i.category == 'performance'])} performance warnings."
            )
            
            # Save markdown documentation report
            md_docs_path = os.path.join(settings.STORAGE_DIR, "reports", f"report_{project_id}.md")
            with open(md_docs_path, "w", encoding="utf-8") as f:
                f.write(f"# Project Audit: {project.name}\n\n")
                f.write(f"## Summary\n{summary}\n\n")
                f.write(f"## Scores\n- Overall Grade: {overall_score}/100\n- Security Grade: {security_score}/100\n\n")
                f.write(f"## Documentation README\n{doc_info.get('readme', '')}\n\n")
                f.write(f"## API Manual\n{doc_info.get('api_docs', '')}\n\n")
                f.write(f"## Draft Unit Tests ({test_info.get('framework', 'pytest')})\n```\n{test_info.get('test_code', '')}\n```\n")

            # PDF Generator (dummy file for now, we will add reportlab compiler later)
            pdf_path = os.path.join(settings.STORAGE_DIR, "reports", f"report_{project_id}.pdf")
            with open(pdf_path, "w") as f:
                f.write("%PDF-1.4 simulated report metadata")

            report = Report(
                project_id=project_id,
                summary=summary,
                overall_score=overall_score,
                security_score=security_score,
                test_coverage_est=62.5 if test_info.get("test_code") else 0.0,
                architecture_notes=arch_notes,
                status="finalized",
                pdf_path=pdf_path,
                markdown_path=md_docs_path
            )
            self.db.add(report)
            
            # Set project status to completed
            project.status = "completed"
            await self.db.commit()
            
            await broadcast_progress(project_id, "AI Planner", "completed", 100, f"Analysis finalized. Overall Score: {overall_score}/100.")
            await self.log_agent_activity(project_id, "AI Planner", "info", "Workflow completed successfully.")

        except Exception as e:
            logger.error(f"Workflow execution failed: {e}")
            project.status = "failed"
            await self.db.commit()
            await broadcast_progress(project_id, "AI Planner", "failed", 100, f"Analysis failed: {str(e)}")
            await self.log_agent_activity(project_id, "AI Planner", "critical", "Workflow failed.", str(e))
