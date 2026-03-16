from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Trip
from routers.trips import _trip_to_out
from schemas import Paginated, TripOut

router = APIRouter(prefix="/users", tags=["users"])

PAGE_SIZE = 20


@router.get("/{user_id}/trips", response_model=Paginated[TripOut])
def get_user_trips(
    user_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(PAGE_SIZE, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Return trips for a given user. Own trips: all. Other users: public only."""
    is_own = str(user_id) == str(current_user["id"])
    q = db.query(Trip).filter(Trip.user_id == str(user_id))
    if not is_own:
        q = q.filter(Trip.is_public.is_(True))
    q = q.order_by(Trip.created_at.desc())

    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return Paginated(
        items=[_trip_to_out(t) for t in items],
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total,
    )
