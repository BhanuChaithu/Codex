import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, JSON, Float, Table
from sqlalchemy.orm import relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan", lazy="selectin")
    ai_requests = relationship("AIRequest", back_populates="user", cascade="all, delete-orphan", lazy="selectin")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan", lazy="selectin")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="pending")  # pending, cloning, analyzing, completed, failed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    owner = relationship("User", back_populates="projects", lazy="selectin")
    repository = relationship("Repository", uselist=False, back_populates="project", cascade="all, delete-orphan", lazy="selectin")
    issues = relationship("Issue", back_populates="project", cascade="all, delete-orphan", lazy="selectin")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan", lazy="selectin")
    logs = relationship("Log", back_populates="project", cascade="all, delete-orphan", lazy="selectin")

class Repository(Base):
    __tablename__ = "repositories"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, unique=True)
    local_path = Column(String, nullable=False)
    git_url = Column(String, nullable=True)
    main_branch = Column(String, default="main")
    size_bytes = Column(Integer, default=0)
    file_count = Column(Integer, default=0)
    lines_of_code = Column(Integer, default=0)
    languages = Column(JSON, nullable=True)  # {"Python": 80.5, "HTML": 19.5}
    framework = Column(String, nullable=True)
    architecture_type = Column(String, nullable=True)
    dependency_graph_json = Column(JSON, nullable=True)
    
    project = relationship("Project", back_populates="repository", lazy="selectin")

class Issue(Base):
    __tablename__ = "issues"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String, nullable=False)
    line_number = Column(Integer, nullable=True)
    code_snippet = Column(Text, nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String, default="medium")  # critical, high, medium, low
    category = Column(String, default="bug")  # bug, security, performance, code_review
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    project = relationship("Project", back_populates="issues", lazy="selectin")
    fixes = relationship("Fix", back_populates="issue", cascade="all, delete-orphan", lazy="selectin")

class Fix(Base):
    __tablename__ = "fixes"
    
    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id", ondelete="CASCADE"), nullable=False)
    original_code = Column(Text, nullable=False)
    fixed_code = Column(Text, nullable=False)
    git_diff = Column(Text, nullable=False)
    applied = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    issue = relationship("Issue", back_populates="fixes", lazy="selectin")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    summary = Column(Text, nullable=True)
    overall_score = Column(Integer, default=100)
    architecture_notes = Column(Text, nullable=True)
    security_score = Column(Integer, default=100)
    test_coverage_est = Column(Float, default=0.0)
    status = Column(String, default="draft")  # draft, finalized
    pdf_path = Column(String, nullable=True)
    markdown_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    project = relationship("Project", back_populates="reports", lazy="selectin")

class AIRequest(Base):
    __tablename__ = "ai_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    cost = Column(Float, default=0.0)
    agent_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="ai_requests", lazy="selectin")

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    
    user = relationship("User", back_populates="sessions", lazy="selectin")

class Log(Base):
    __tablename__ = "logs"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    agent_name = Column(String, nullable=False)
    level = Column(String, default="info")  # info, warning, error, critical
    message = Column(Text, nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    project = relationship("Project", back_populates="logs", lazy="selectin")
