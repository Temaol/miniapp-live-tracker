from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Trip
from schemas import Paginated, TripOut, TripSaveRequest

router = APIRouter(prefix="/trips", tags=["trips"])

PAGE_SIZE = 20


def _trip_to_out(trip: Trip) -> TripOut:
    return TripOut(
        id=trip.id,
        user_id=trip.user_id,
        username=trip.username,
        name=trip.name,
        status=trip.status,
        started_at=trip.started_at,
        finished_at=trip.finished_at,
        distance=trip.distance,
        duration=trip.duration,
        avg_speed=trip.avg_speed,
        max_speed=trip.max_speed,
        path=trip.path,
        is_public=trip.is_public,
        created_at=trip.created_at,
    )


@router.post("", status_code=status.HTTP_201_CREATED, response_model=dict)
def save_trip(
    body: TripSaveRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Save a completed trip from the frontend."""
    t = body.trip

    # Prevent users from saving trips owned by someone else
    if str(t.user_id) != str(current_user["id"]):
        raise HTTPException(status_code=403, detail="Forbidden")

    # Upsert — if the same ID is re-sent, update stats
    existing = db.get(Trip, t.id)
    if existing:
        db_trip = existing
    else:
        db_trip = Trip(id=t.id)
        db.add(db_trip)

    db_trip.user_id = str(t.user_id)
    db_trip.username = t.username
    db_trip.name = t.name
    db_trip.status = t.status
    db_trip.distance = t.distance
    db_trip.duration = t.duration
    db_trip.avg_speed = t.avg_speed
    db_trip.max_speed = t.max_speed
    db_trip.is_public = t.is_public
    db_trip.path = [c.model_dump() for c in t.path]

    # Parse ISO dates safely
    try:
        db_trip.started_at = datetime.fromisoformat(t.started_at.replace("Z", "+00:00"))
    except ValueError:
        db_trip.started_at = datetime.utcnow()

    if t.finished_at:
        try:
            db_trip.finished_at = datetime.fromisoformat(t.finished_at.replace("Z", "+00:00"))
        except ValueError:
            db_trip.finished_at = None

    db.commit()
    return {"id": db_trip.id}


@router.get("/public", response_model=Paginated[TripOut])
def list_public_trips(
    page: int = Query(1, ge=1),
    page_size: int = Query(PAGE_SIZE, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Public feed — all trips marked is_public, newest first."""
    q = (
        db.query(Trip)
        .filter(Trip.is_public.is_(True))
        .order_by(Trip.created_at.desc())
    )
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return Paginated(
        items=[_trip_to_out(t) for t in items],
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total,
    )


@router.get("/{trip_id}", response_model=TripOut)
def get_trip(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    trip = db.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    # Allow access to own trips or public ones
    if trip.user_id != str(current_user["id"]) and not trip.is_public:
        raise HTTPException(status_code=403, detail="Forbidden")
    return _trip_to_out(trip)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    trip = db.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.user_id != str(current_user["id"]):
        raise HTTPException(status_code=403, detail="Forbidden")
    db.delete(trip)
    db.commit()
