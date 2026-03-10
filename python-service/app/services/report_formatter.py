from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

from jinja2 import Environment, FileSystemLoader, select_autoescape


_TEMPLATE_DIR = Path(__file__).resolve().parents[1] / "templates"


class ReportFormatter:
    """Formatter utility for briefing report generation."""

    def __init__(self) -> None:
        self._env = Environment(
            loader=FileSystemLoader(str(_TEMPLATE_DIR)),
            autoescape=select_autoescape(enabled_extensions=("html", "xml"), default_for_string=True),
        )

    def render_base(self, title: str, body: str) -> str:
        template = self._env.get_template("base.html")
        return template.render(title=title, body=body, generated_at=self.generated_timestamp())

    def render_briefing_report(self, briefing: Any) -> str:
        """
        Transforms a Briefing DB model into a view model and renders it using report.html.
        """
        view_model = self._transform_to_view_model(briefing)
        template = self._env.get_template("report.html")
        return template.render(**view_model)

    def _transform_to_view_model(self, briefing: Any) -> Dict[str, Any]:
        """
        Processes briefing data for presentation:
        - sorting points,
        - normalizing labels,
        - constructing title,
        - etc.
        """
        # Construction of report title
        report_title = f"Briefing Report: {briefing.company_name} ({briefing.ticker})"

        # Sorting key points (by ID as a proxy for input order if needed, but here we just pass them)
        key_points = [p.content for p in sorted(briefing.key_points, key=lambda x: x.id)]
        
        # Grouping risks
        risks = [r.content for r in sorted(briefing.risks, key=lambda x: x.id)]

        # Normalizing metrics (sorting by name for consistent display)
        metrics = [
            {"name": m.name.title(), "value": m.value} 
            for m in sorted(briefing.metrics, key=lambda x: x.name)
        ]

        # Display-ready metadata
        generated_at_display = (
            briefing.generated_at.strftime("%B %d, %Y at %I:%M %p UTC")
            if briefing.generated_at
            else self.generated_timestamp()
        )

        return {
            "title": report_title,
            "company_name": briefing.company_name,
            "ticker": briefing.ticker.upper(),
            "sector": briefing.sector or "N/A",
            "analyst_name": briefing.analyst_name or "Unknown Analyst",
            "summary": briefing.summary,
            "recommendation": briefing.recommendation,
            "key_points": key_points,
            "risks": risks,
            "metrics": metrics,
            "generated_at": generated_at_display,
        }

    @staticmethod
    def generated_timestamp() -> str:
        return datetime.now(timezone.utc).strftime("%B %d, %Y at %I:%M %p UTC")
