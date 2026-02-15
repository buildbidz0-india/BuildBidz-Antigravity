from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.db.repository import repo

router = APIRouter()


class ProjectCreate(BaseModel):
    name: str
    location: Optional[str] = None
    description: Optional[str] = None
    status: str = "Planning"
    progress: int = 0


@router.get("")
async def list_projects():
    """List all projects."""
    try:
        projects = await repo.list_projects()
        return {"projects": projects}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_project(body: ProjectCreate):
    """Create a new project."""
    try:
        project = await repo.create_project(
            name=body.name,
            location=body.location,
            description=body.description,
            status=body.status,
            progress=body.progress,
        )
        return project
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id:int}")
async def get_project(project_id: int):
    """Get a project by ID."""
    try:
        project = await repo.get_project_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
