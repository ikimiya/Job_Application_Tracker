from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any
from datetime import date
import re

VALID_STATUSES = {"applied", "interview", "offer", "rejected", "ghosted"}

def _validate_date_str(v: Optional[str]) -> Optional[str]:
    if v is None:
        return None
    if not isinstance(v, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
        raise ValueError("date_applied must be in YYYY-MM-DD format")
    try:
        year, month, day = v.split("-")
        date(int(year), int(month), int(day))   # raises if not a real date
    except ValueError:
        raise ValueError("date_applied is not a valid calendar date (YYYY-MM-DD)")
    return v


def _validate_status(v: Optional[str]) -> Optional[str]:
    if v is None:
        return None
    if v.lower() not in VALID_STATUSES:
        raise ValueError(
            f"Invalid status '{v}'. Must be one of: {', '.join(sorted(VALID_STATUSES))}"
        )
    return v.lower()

class JobCreate(BaseModel):
    model_config = {"json_schema_extra": {"title": "JobCreate"}}

    company: str = Field(example="Google")
    role: str = Field(example="Software Engineer")
    date_applied: str = Field(example="2026-05-17")
    status: Optional[str] = Field(default="applied", example="applied")
    job_description: Optional[str] = Field(default=None,
                                           example="Build and maintain web applications using React and Python.")
    website: Optional[str] = Field(default=None, example="https://careers.google.com")
    notes: Optional[str] = Field(default=None, example="Referral from a friend. Follow up in 2 weeks.")

    @field_validator("company", "role")
    @classmethod
    def must_not_be_blank(cls, v: str, info) -> str:
        if not v.strip():
            raise ValueError(f"{info.field_name} must not be blank")
        return v.strip()

    @field_validator("date_applied")
    @classmethod
    def validate_date(cls, v: str) -> str:
        result = _validate_date_str(v)
        if result is None:
            raise ValueError("date_applied is required")
        return result

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        result = _validate_status(v)
        if result is None:
            raise ValueError("status is required")
        return result

    def date_applied_as_date(self) -> date:
        """Convenience method for the endpoint to get a date object."""
        year, month, day = self.date_applied.split("-")
        return date(int(year), int(month), int(day))


class JobUpdate(BaseModel):
    model_config = {"json_schema_extra": {"title": "JobUpdate"}}

    company:         Optional[str] = None
    role:            Optional[str] = None
    date_applied:    Optional[str] = None
    status:          Optional[str] = None
    job_description: Optional[str] = None
    website:         Optional[str] = None
    notes:           Optional[str] = None

    @field_validator("company", "role")
    @classmethod
    def must_not_be_blank(cls, v: Optional[str], info) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError(f"{info.field_name} must not be blank")
        return v.strip() if v else v

    @field_validator("date_applied")
    @classmethod
    def validate_date(cls, v: Optional[str]) -> Optional[str]:
        return _validate_date_str(v)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        return _validate_status(v)

    def date_applied_as_date(self) -> Optional[date]:
        """Convenience method for the endpoint to get a date object."""
        if self.date_applied is None:
            return None
        year, month, day = self.date_applied.split("-")
        return date(int(year), int(month), int(day))

class JobResponse(BaseModel):
    model_config = {"from_attributes": True, "json_schema_extra": {"title": "JobResponse"}}

    id:              int
    company:         str
    role:            str
    date_applied:    date
    status:          str
    job_description: Optional[str] = None
    website:         Optional[str] = None
    notes:           Optional[str] = None