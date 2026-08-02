from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import datetime

class FixBase(BaseModel):
    issue_id: int
    original_code: str
    fixed_code: str
    git_diff: str

class FixResponse(FixBase):
    id: int
    applied: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class IssueBase(BaseModel):
    file_path: str
    line_number: Optional[int] = None
    code_snippet: Optional[str] = None
    title: str
    description: str
    severity: str  # critical, high, medium, low
    category: str  # bug, security, performance, code_review

class IssueCreate(IssueBase):
    project_id: int

class IssueResponse(IssueBase):
    id: int
    project_id: int
    is_resolved: bool
    created_at: datetime.datetime
    fixes: List[FixResponse] = []

    class Config:
        from_attributes = True

class LogResponse(BaseModel):
    id: int
    project_id: int
    agent_name: str
    level: str
    message: str
    details: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class AgentProgress(BaseModel):
    project_id: int
    agent_name: str
    status: str  # running, completed, failed
    percentage: int
    message: str
    timestamp: float
