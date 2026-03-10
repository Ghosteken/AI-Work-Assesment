from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class BriefingMetricBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    value: str = Field(..., min_length=1, max_length=255)


class BriefingMetricCreate(BriefingMetricBase):
    pass


class BriefingMetricRead(BriefingMetricBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class BriefingCreate(BaseModel):
    companyName: str = Field(..., min_length=1, max_length=255, alias="company_name")
    ticker: str = Field(..., min_length=1, max_length=10)
    sector: Optional[str] = Field(None, max_length=255)
    analystName: Optional[str] = Field(None, max_length=255, alias="analyst_name")
    summary: str = Field(..., min_length=1)
    recommendation: str = Field(..., min_length=1)
    keyPoints: List[str] = Field(..., alias="key_points")
    risks: List[str]
    metrics: List[BriefingMetricCreate] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("ticker")
    @classmethod
    def normalize_ticker(cls, v: str) -> str:
        return v.upper()

    @field_validator("keyPoints")
    @classmethod
    def validate_key_points(cls, v: List[str]) -> List[str]:
        if len(v) < 2:
            raise ValueError("At least 2 key points are required")
        return v

    @field_validator("risks")
    @classmethod
    def validate_risks(cls, v: List[str]) -> List[str]:
        if len(v) < 1:
            raise ValueError("At least 1 risk is required")
        return v

    @field_validator("metrics")
    @classmethod
    def validate_unique_metrics(cls, v: List[BriefingMetricCreate]) -> List[BriefingMetricCreate]:
        names = [m.name for m in v]
        if len(names) != len(set(names)):
            raise ValueError("Metric names must be unique within the same briefing")
        return v


class BriefingPointRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    content: str


class BriefingRiskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    content: str


class BriefingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    company_name: str = Field(..., alias="companyName")
    ticker: str
    sector: Optional[str]
    analyst_name: Optional[str] = Field(..., alias="analystName")
    summary: str
    recommendation: str
    is_generated: bool
    generated_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    key_points: List[BriefingPointRead] = Field(..., alias="keyPoints")
    risks: List[BriefingRiskRead]
    metrics: List[BriefingMetricRead]
