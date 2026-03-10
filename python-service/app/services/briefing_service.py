from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.briefing import Briefing, BriefingMetric, BriefingPoint, BriefingRisk
from app.schemas.briefing import BriefingCreate
from app.services.report_formatter import ReportFormatter


class BriefingService:
    def __init__(self, db: Session):
        self.db = db
        self.formatter = ReportFormatter()

    def create_briefing(self, payload: BriefingCreate) -> Briefing:
        briefing = Briefing(
            company_name=payload.companyName,
            ticker=payload.ticker,
            sector=payload.sector,
            analyst_name=payload.analystName,
            summary=payload.summary,
            recommendation=payload.recommendation,
        )
        self.db.add(briefing)
        self.db.flush()  # Get briefing.id

        for point_content in payload.keyPoints:
            point = BriefingPoint(briefing_id=briefing.id, content=point_content)
            self.db.add(point)

        for risk_content in payload.risks:
            risk = BriefingRisk(briefing_id=briefing.id, content=risk_content)
            self.db.add(risk)

        for metric_data in payload.metrics:
            metric = BriefingMetric(
                briefing_id=briefing.id,
                name=metric_data.name,
                value=metric_data.value
            )
            self.db.add(metric)

        self.db.commit()
        self.db.refresh(briefing)
        return briefing

    def get_briefing(self, briefing_id: int) -> Optional[Briefing]:
        query = (
            select(Briefing)
            .where(Briefing.id == briefing_id)
            .options(
                joinedload(Briefing.key_points),
                joinedload(Briefing.risks),
                joinedload(Briefing.metrics)
            )
        )
        return self.db.execute(query).unique().scalar_one_or_none()

    def generate_report(self, briefing_id: int) -> str:
        briefing = self.get_briefing(briefing_id)
        if not briefing:
            raise ValueError("Briefing not found")

        # Mark as generated
        briefing.is_generated = True
        briefing.generated_at = datetime.now(timezone.utc)
        self.db.commit()

        # Render HTML
        return self.formatter.render_briefing_report(briefing)

    def get_rendered_html(self, briefing_id: int) -> Optional[str]:
        briefing = self.get_briefing(briefing_id)
        if not briefing:
            return None
        
        # If it hasn't been generated yet, we might want to return 404 or generate it.
        # The requirements say GET /briefings/{id}/html returns the generated HTML.
        # It's safer to only return if is_generated is True.
        if not briefing.is_generated:
            return None

        return self.formatter.render_briefing_report(briefing)
