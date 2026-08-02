from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import datetime

class RepositoryBase(BaseModel):
    git_url: Optional[str] = None
    main_branch: str = "main"

class RepositoryCreate(RepositoryBase):
    local_path: str

class RepositoryResponse(RepositoryBase):
    id: int
    size_bytes: int
    file_count: int
    lines_of_code: int
    languages: Optional[Dict[str, float]] = None
    framework: Optional[str] = None
    architecture_type: Optional[str] = None
    dependency_graph_json: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    git_url: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    owner_id: int
    status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    repository: Optional[RepositoryResponse] = None

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_projects: int
    total_analyses: int
    total_issues: int
    critical_issues: int
    security_score_avg: float
    total_ai_tokens: int
    ai_estimated_cost: float
    monthly_activity: List[Dict[str, Any]]
