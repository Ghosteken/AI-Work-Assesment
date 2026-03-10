from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.briefing import BriefingCreate, BriefingRead
from app.services.briefing_service import BriefingService


router = APIRouter(prefix="/briefings", tags=["Briefings"])


@router.post("", response_model=BriefingRead, status_code=201)
def create_briefing(payload: BriefingCreate, db: Session = Depends(get_db)):
    """
    Creates a new briefing with its associated points, risks, and metrics.
    """
    service = BriefingService(db)
    return service.create_briefing(payload)


@router.get("/{briefing_id}", response_model=BriefingRead)
def get_briefing(briefing_id: int, db: Session = Depends(get_db)):
    """
    Retrieves the structured data for a single briefing.
    """
    service = BriefingService(db)
    briefing = service.get_briefing(briefing_id)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return briefing


@router.post("/{briefing_id}/generate")
def generate_report(briefing_id: int, db: Session = Depends(get_db)):
    """
    Generates a rendered HTML report for an existing briefing and marks it as generated.
    """
    service = BriefingService(db)
    try:
        html_content = service.generate_report(briefing_id)
        return Response(content=html_content, media_type="text/html")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{briefing_id}/html")
def get_rendered_html(briefing_id: int, db: Session = Depends(get_db)):
    """
    Returns the previously generated HTML for a briefing.
    """
    service = BriefingService(db)
    html_content = service.get_rendered_html(briefing_id)
    if not html_content:
        raise HTTPException(
            status_code=404, 
            detail="Rendered HTML not found. Ensure the briefing exists and has been generated."
        )
    return Response(content=html_content, media_type="text/html")
