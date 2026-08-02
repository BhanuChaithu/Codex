from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
import os

from app.database.session import get_db
from app.database.models import Issue, Fix, Project, Repository
from app.schemas.analysis import IssueResponse, FixResponse
from app.api.v1.auth import get_current_user
from app.database.models import User
from app.agents.autofix import AutoFixAgent

router = APIRouter()

@router.get("/project/{project_id}", response_model=List[IssueResponse])
async def list_issues(
    project_id: int,
    category: Optional[str] = None,
    severity: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists issues for a project, with filters for category (bug, security) and severity (critical, high)."""
    # Verify project access
    proj_check = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == current_user.id)
    )
    if not proj_check.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not authorized to access project details.")
        
    query = select(Issue).options(selectinload(Issue.fixes)).where(Issue.project_id == project_id)
    if category:
        query = query.where(Issue.category == category)
    if severity:
        query = query.where(Issue.severity == severity)
        
    query = query.order_by(Issue.severity.desc(), Issue.id.asc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/fix/{fix_id}/apply")
async def apply_fix(
    fix_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Executes Auto Fix code replacement, updating the physical file in the local workspace."""
    result = await db.execute(
        select(Fix)
        .join(Issue, Issue.id == Fix.issue_id)
        .join(Project, Project.id == Issue.project_id)
        .where(Fix.id == fix_id, Project.owner_id == current_user.id)
    )
    fix = result.scalar_one_or_none()
    if not fix:
        raise HTTPException(status_code=404, detail="Fix details not found or project access denied.")
        
    if fix.applied:
        return {"message": "Fix has already been applied."}
        
    # Get repository path details
    repo_result = await db.execute(
        select(Repository).where(Repository.project_id == fix.issue.project_id)
    )
    repo = repo_result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository path workspace missing.")
        
    full_file_path = os.path.join(repo.local_path, fix.issue.file_path)
    
    # Run AutoFix replacement write
    autofixer = AutoFixAgent()
    success = autofixer.apply_fix_to_file(full_file_path, fix.original_code, fix.fixed_code)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to write patch updates to source file.")
        
    # Update status
    fix.applied = True
    fix.issue.is_resolved = True
    await db.commit()
    
    return {"message": "Code patch successfully applied to project workspace.", "status": "resolved"}

@router.post("/fix/{fix_id}/undo")
async def undo_fix(
    fix_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reverts applied code patches back to the original syntax state."""
    result = await db.execute(
        select(Fix)
        .join(Issue, Issue.id == Fix.issue_id)
        .join(Project, Project.id == Issue.project_id)
        .where(Fix.id == fix_id, Project.owner_id == current_user.id)
    )
    fix = result.scalar_one_or_none()
    if not fix:
        raise HTTPException(status_code=404, detail="Fix details not found or project access denied.")
        
    if not fix.applied:
        return {"message": "Fix is not currently applied."}
        
    repo_result = await db.execute(
        select(Repository).where(Repository.project_id == fix.issue.project_id)
    )
    repo = repo_result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository path workspace missing.")
        
    full_file_path = os.path.join(repo.local_path, fix.issue.file_path)
    
    # Revert by replacing fixed_code with original_code
    autofixer = AutoFixAgent()
    success = autofixer.apply_fix_to_file(full_file_path, fix.fixed_code, fix.original_code)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to revert patch updates in source file.")
        
    # Update status
    fix.applied = False
    fix.issue.is_resolved = False
    await db.commit()
    
    return {"message": "Code patch reverted successfully.", "status": "unresolved"}
