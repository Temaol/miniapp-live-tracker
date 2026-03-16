import json
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(32), index=True)
    username: Mapped[str] = mapped_column(String(128), default="")
    name: Mapped[str] = mapped_column(String(256), default="")
    status: Mapped[str] = mapped_column(String(16), default="completed")  # active | paused | completed

    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Stats
    distance: Mapped[float] = mapped_column(Float, default=0.0)   # metres
    duration: Mapped[int] = mapped_column(Integer, default=0)      # seconds
    avg_speed: Mapped[float] = mapped_column(Float, default=0.0)   # km/h
    max_speed: Mapped[float] = mapped_column(Float, default=0.0)   # km/h

    # Full GPS path stored as JSON array of {lat, lng, timestamp, speed, accuracy, altitude}
    path_json: Mapped[str] = mapped_column(Text, default="[]")

    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    segments: Mapped[list["Segment"]] = relationship(
        "Segment", back_populates="trip", cascade="all, delete-orphan"
    )

    @property
    def path(self) -> list[dict]:
        return json.loads(self.path_json)

    @path.setter
    def path(self, value: list[dict]) -> None:
        self.path_json = json.dumps(value)


class Segment(Base):
    """A named sub-section of a trip that can be shared publicly."""

    __tablename__ = "segments"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    trip_id: Mapped[str] = mapped_column(ForeignKey("trips.id"), index=True)
    user_id: Mapped[str] = mapped_column(String(32), index=True)
    username: Mapped[str] = mapped_column(String(128), default="")
    name: Mapped[str] = mapped_column(String(256), default="")

    # Bounding coords (for quick display without parsing full path)
    start_lat: Mapped[float] = mapped_column(Float, default=0.0)
    start_lng: Mapped[float] = mapped_column(Float, default=0.0)
    end_lat: Mapped[float] = mapped_column(Float, default=0.0)
    end_lng: Mapped[float] = mapped_column(Float, default=0.0)

    distance: Mapped[float] = mapped_column(Float, default=0.0)
    duration: Mapped[int] = mapped_column(Integer, default=0)
    avg_speed: Mapped[float] = mapped_column(Float, default=0.0)
    max_speed: Mapped[float] = mapped_column(Float, default=0.0)

    path_json: Mapped[str] = mapped_column(Text, default="[]")
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    trip: Mapped["Trip"] = relationship("Trip", back_populates="segments")

    @property
    def path(self) -> list[dict]:
        return json.loads(self.path_json)

    @path.setter
    def path(self, value: list[dict]) -> None:
        self.path_json = json.dumps(value)
