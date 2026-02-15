from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

from app.db.repository import repo
from app.api.deps import get_firebase_payload_optional, TokenPayload

router = APIRouter()


class ProjectCreate(BaseModel):
    name: str
    location: Optional[str] = None
    description: Optional[str] = None
    status: str = "Planning"
    progress: int = 0


class ProjectTeamMember(BaseModel):
    name: str
    role: str
    initials: str


class ProjectMilestone(BaseModel):
    name: str
    date: str
    completed: bool = False


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    progress: Optional[int] = None
    team: Optional[list[ProjectTeamMember]] = None
    milestones: Optional[list[ProjectMilestone]] = None


@router.get("/stats")
async def project_stats(
    firebase_user: Optional[TokenPayload] = Depends(get_firebase_payload_optional),
):
    """Return project counts for dashboard (total, active, planning)."""
    try:
        return await repo.get_projects_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def list_projects(
    firebase_user: Optional[TokenPayload] = Depends(get_firebase_payload_optional),
):
    """List all projects. Accepts optional Firebase ID token in Authorization header."""
    try:
        projects = await repo.list_projects()
        return {"projects": projects}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_project(
    body: ProjectCreate,
    firebase_user: Optional[TokenPayload] = Depends(get_firebase_payload_optional),
):
    """Create a new project. Accepts optional Firebase ID token in Authorization header."""
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
async def get_project(
    project_id: int,
    firebase_user: Optional[TokenPayload] = Depends(get_firebase_payload_optional),
):
    """Get a project by ID. Accepts optional Firebase ID token in Authorization header."""
    try:
        project = await repo.get_project_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{project_id:int}")
async def update_project(
    project_id: int,
    body: ProjectUpdate,
    firebase_user: Optional[TokenPayload] = Depends(get_firebase_payload_optional),
):
    """Update a project (including team and milestones)."""
    try:
        project = await repo.get_project_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        team = [m.model_dump() for m in body.team] if body.team is not None else None
        milestones = [m.model_dump() for m in body.milestones] if body.milestones is not None else None
        updated = await repo.update_project(
            project_id,
            name=body.name,
            location=body.location,
            status=body.status,
            description=body.description,
            progress=body.progress,
            team=team,
            milestones=milestones,
        )
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
