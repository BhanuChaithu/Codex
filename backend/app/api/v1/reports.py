from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os

from app.database.session import get_db
from app.database.models import Report, Project
from app.schemas.report import ReportResponse
from app.api.v1.auth import get_current_user
from app.database.models import User

router = APIRouter()

@router.get("/project/{project_id}", response_model=ReportResponse)
async def get_project_report(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves computed grades and file paths for a project analysis."""
    result = await db.execute(
        select(Report)
        .join(Project, Project.id == Report.project_id)
        .where(Report.project_id == project_id, Project.owner_id == current_user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="No analysis reports compiled for project yet.")
    return report

@router.get("/project/{project_id}/markdown")
async def get_markdown_content(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns raw markdown text of the project audit for UI rendering."""
    result = await db.execute(
        select(Report)
        .join(Project, Project.id == Report.project_id)
        .where(Report.project_id == project_id, Project.owner_id == current_user.id)
    )
    report = result.scalar_one_or_none()
    if not report or not report.markdown_path or not os.path.exists(report.markdown_path):
        raise HTTPException(status_code=404, detail="Markdown audit report not found on storage.")
        
    try:
        with open(report.markdown_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read report file: {str(e)}")

@router.get("/project/{project_id}/download/{format}")
async def download_report(
    project_id: int,
    format: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Serves report file downloads (PDF or MD formats)."""
    result = await db.execute(
        select(Report)
        .join(Project, Project.id == Report.project_id)
        .where(Report.project_id == project_id, Project.owner_id == current_user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not compiled.")
        
    if format.lower() == "pdf":
        file_path = report.pdf_path
        media_type = "application/pdf"
        filename = f"codex_detective_report_{project_id}.pdf"
    elif format.lower() in ["md", "markdown"]:
        file_path = report.markdown_path
        media_type = "text/markdown"
        filename = f"codex_detective_report_{project_id}.md"
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Supported formats: pdf, md.")
        
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Requested file is not available on server storage.")
        
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=filename
    )
