from datetime import datetime

from pydantic import BaseModel, Field


# ── Coordinate ───────────────────────────────────────────────────────────────

class CoordSchema(BaseModel):
    lat: float
    lng: float
    timestamp: int
    speed: float | None = None
    accuracy: float = 0.0
    altitude: float | None = None


# ── Trip ─────────────────────────────────────────────────────────────────────

class TripCreate(BaseModel):
    id: str
    user_id: str = Field(alias="userId")
    username: str = ""
    name: str = ""
    status: str = "completed"
    started_at: str = Field(alias="startedAt")
    finished_at: str | None = Field(default=None, alias="finishedAt")
    distance: float = 0.0
    duration: int = 0
    avg_speed: float = Field(default=0.0, alias="avgSpeed")
    max_speed: float = Field(default=0.0, alias="maxSpeed")
    path: list[CoordSchema] = []
    is_public: bool = Field(default=False, alias="isPublic")

    model_config = {"populate_by_name": True}


class TripOut(BaseModel):
    id: str
    user_id: str
    username: str
    name: str
    status: str
    started_at: datetime
    finished_at: datetime | None
    distance: float
    duration: int
    avg_speed: float
    max_speed: float
    path: list[CoordSchema]
    is_public: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TripSaveRequest(BaseModel):
    trip: TripCreate
    user_id: int = Field(alias="userId")

    model_config = {"populate_by_name": True}


# ── Segment ──────────────────────────────────────────────────────────────────

class SegmentCreate(BaseModel):
    id: str
    trip_id: str = Field(alias="tripId")
    user_id: str = Field(alias="userId")
    username: str = ""
    name: str = ""
    start_lat: float = Field(default=0.0, alias="startLat")
    start_lng: float = Field(default=0.0, alias="startLng")
    end_lat: float = Field(default=0.0, alias="endLat")
    end_lng: float = Field(default=0.0, alias="endLng")
    distance: float = 0.0
    duration: int = 0
    avg_speed: float = Field(default=0.0, alias="avgSpeed")
    max_speed: float = Field(default=0.0, alias="maxSpeed")
    path: list[CoordSchema] = []
    is_public: bool = Field(default=True, alias="isPublic")

    model_config = {"populate_by_name": True}


class SegmentOut(BaseModel):
    id: str
    trip_id: str
    user_id: str
    username: str
    name: str
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    distance: float
    duration: int
    avg_speed: float
    max_speed: float
    path: list[CoordSchema]
    is_public: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Pagination ────────────────────────────────────────────────────────────────

class Paginated[T](BaseModel):
    items: list[T]
    total: int
    page: int
    page_size: int
    has_more: bool
