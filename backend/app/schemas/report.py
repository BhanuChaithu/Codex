from pydantic import BaseModel
from typing import Optional
import datetime

class ReportBase(BaseModel):
    summary: Optional[str] = None
    overall_score: int = 100
    architecture_notes: Optional[str] = None
    security_score: int = 100
    test_coverage_est: float = 0.0

class ReportResponse(ReportBase):
    id: int
    project_id: int
    status: str
    pdf_path: Optional[str] = None
    markdown_path: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True
