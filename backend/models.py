from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    sex: Mapped[str] = mapped_column(String(10), nullable=False)
    patient_code: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    requesting_physician: Mapped[str] = mapped_column(String(255), nullable=False)
    lab_technician: Mapped[str] = mapped_column(String(255), nullable=False)
    specimen_type: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    tests: Mapped[list["TestRecord"]] = relationship("TestRecord", back_populates="patient")


class TestRecord(Base):
    __tablename__ = "test_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(Integer, ForeignKey("patients.id"), nullable=False)
    test_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending | analyzed | reported

    patient: Mapped["Patient"] = relationship("Patient", back_populates="tests")
    images: Mapped[list["Image"]] = relationship("Image", back_populates="test_record")
    rbc_results: Mapped[list["RBCResult"]] = relationship("RBCResult", back_populates="test_record")
    report: Mapped["Report | None"] = relationship("Report", back_populates="test_record", uselist=False)


class Image(Base):
    __tablename__ = "images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    test_record_id: Mapped[int] = mapped_column(Integer, ForeignKey("test_records.id"), nullable=False)
    original_path: Mapped[str] = mapped_column(String(500), nullable=False)
    annotated_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    test_record: Mapped["TestRecord"] = relationship("TestRecord", back_populates="images")
    rbc_result: Mapped["RBCResult | None"] = relationship("RBCResult", back_populates="image", uselist=False)


class RBCResult(Base):
    __tablename__ = "rbc_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    test_record_id: Mapped[int] = mapped_column(Integer, ForeignKey("test_records.id"), nullable=False)
    image_id: Mapped[int] = mapped_column(Integer, ForeignKey("images.id"), nullable=False)
    rbc_count: Mapped[int] = mapped_column(Integer, nullable=False)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)

    test_record: Mapped["TestRecord"] = relationship("TestRecord", back_populates="rbc_results")
    image: Mapped["Image"] = relationship("Image", back_populates="rbc_result")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    test_record_id: Mapped[int] = mapped_column(Integer, ForeignKey("test_records.id"), nullable=False, unique=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    pdf_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    test_record: Mapped["TestRecord"] = relationship("TestRecord", back_populates="report")
