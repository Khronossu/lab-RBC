from datetime import datetime
from pydantic import BaseModel, ConfigDict


# ── Patient ──────────────────────────────────────────────────────────────────

class PatientCreate(BaseModel):
    name: str
    age: int
    sex: str
    patient_code: str
    requesting_physician: str
    lab_technician: str
    specimen_type: str


class PatientOut(PatientCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ── TestRecord ────────────────────────────────────────────────────────────────

class TestCreate(BaseModel):
    patient_id: int


class ImageOut(BaseModel):
    id: int
    filename: str
    original_path: str
    annotated_path: str | None
    uploaded_at: datetime
    model_config = ConfigDict(from_attributes=True)


class RBCResultOut(BaseModel):
    id: int
    image_id: int
    rbc_count: int
    metadata_: dict
    model_config = ConfigDict(from_attributes=True)


class ReportOut(BaseModel):
    id: int
    content: str
    pdf_path: str | None
    generated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class TestOut(BaseModel):
    id: int
    patient_id: int
    test_date: datetime
    status: str
    images: list[ImageOut] = []
    rbc_results: list[RBCResultOut] = []
    report: ReportOut | None = None
    model_config = ConfigDict(from_attributes=True)
