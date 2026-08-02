import os
import zipfile
import shutil
import uuid
import logging
from typing import Optional
from fastapi import UploadFile
from app.core.config import settings

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        self.storage_dir = settings.STORAGE_DIR
        self.uploads_dir = os.path.join(self.storage_dir, "uploads")
        self.clones_dir = os.path.join(self.storage_dir, "clones")
        self.reports_dir = os.path.join(self.storage_dir, "reports")
        
        # Ensure all folders exist
        os.makedirs(self.uploads_dir, exist_ok=True)
        os.makedirs(self.clones_dir, exist_ok=True)
        os.makedirs(self.reports_dir, exist_ok=True)

    async def save_uploaded_file(self, file: UploadFile) -> str:
        """Saves file to local uploads directory and returns its absolute path."""
        file_ext = os.path.splitext(file.filename)[1] if file.filename else ".zip"
        unique_name = f"{uuid.uuid4()}{file_ext}"
        destination = os.path.join(self.uploads_dir, unique_name)
        
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        logger.info(f"File uploaded successfully and saved to {destination}")
        return destination

    def unzip_project(self, zip_path: str) -> str:
        """Extracts zip archive safely, protecting against zip-slip directory traversal."""
        project_id = str(uuid.uuid4())
        extract_to = os.path.join(self.clones_dir, project_id)
        os.makedirs(extract_to, exist_ok=True)
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Check for directory traversal attacks (zip-slip)
            for member in zip_ref.namelist():
                filename = os.path.basename(member)
                # skip directory entries or entries outside path
                if not filename:
                    continue
                
                # Check resolved path
                target_path = os.path.abspath(os.path.join(extract_to, member))
                if not target_path.startswith(os.path.abspath(extract_to)):
                    raise Exception(f"Potential directory traversal attack detected in zip: {member}")
                
            zip_ref.extractall(extract_to)
            
        logger.info(f"Successfully unzipped {zip_path} to {extract_to}")
        return extract_to

    def get_project_size(self, path: str) -> tuple[int, int]:
        """Calculates project directory size in bytes and file count."""
        total_size = 0
        total_files = 0
        for dirpath, dirnames, filenames in os.walk(path):
            # Avoid node_modules, .git, venv, pycache directories
            if any(ignored in dirpath for ignored in [".git", "node_modules", "venv", "__pycache__", "dist", "build"]):
                continue
            for f in filenames:
                fp = os.path.join(dirpath, f)
                if not os.path.islink(fp):
                    try:
                        total_size += os.path.getsize(fp)
                        total_files += 1
                    except OSError:
                        pass
        return total_size, total_files

    def cleanup_path(self, path: str):
        """Clean up local directory or file."""
        if os.path.exists(path):
            if os.path.isdir(path):
                shutil.rmtree(path)
            else:
                os.remove(path)
            logger.info(f"Cleaned up path {path}")

storage_service = StorageService()
