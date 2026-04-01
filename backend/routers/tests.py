import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models import Image, Patient, TestRecord
from schemas import TestCreate, TestOut

router = APIRouter(prefix="/tests", tags=["tests"])


@router.post("", response_model=TestOut, status_code=201)
def create_test(payload: TestCreate, db: Session = Depends(get_db)):
    if not db.get(Patient, payload.patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")
    test = TestRecord(patient_id=payload.patient_id)
    db.add(test)
    db.commit()
    db.refresh(test)
    return test


@router.post("/{test_id}/images", response_model=TestOut)
async def upload_images(
    test_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    test = db.get(TestRecord, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    save_dir = Path(settings.storage_path) / "images" / "original" / str(test_id)
    save_dir.mkdir(parents=True, exist_ok=True)

    for file in files:
        ext = Path(file.filename or "image.jpg").suffix or ".jpg"
        unique_name = f"{uuid.uuid4().hex}{ext}"
        dest = save_dir / unique_name
        content = await file.read()
        dest.write_bytes(content)

        image = Image(
            test_record_id=test_id,
            original_path=str(dest),
            filename=file.filename or unique_name,
        )
        db.add(image)

    db.commit()
    db.refresh(test)
    return test


@router.get("/{test_id}", response_model=TestOut)
def get_test(test_id: int, db: Session = Depends(get_db)):
    test = db.get(TestRecord, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    return test


@router.get("", response_model=list[TestOut])
def list_tests(
    patient_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(TestRecord)
    if patient_id:
        query = query.filter(TestRecord.patient_id == patient_id)
    return query.order_by(TestRecord.test_date.desc()).all()
