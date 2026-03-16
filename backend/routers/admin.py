from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import get_admin
from database import get_db
from models import Trip
from routers.trips import _trip_to_out
from schemas import GlobalStatsOut, Paginated, TripOut, UserStatsOut

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_admin)],  # all routes require admin key
)

PAGE_SIZE = 50


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_user_stats(user_id: str, db: Session) -> UserStatsOut | None:
    trips = (
        db.query(Trip)
        .filter(Trip.user_id == user_id)
        .order_by(Trip.started_at.asc())
        .all()
    )
    if not trips:
        return None

    username = trips[-1].username or user_id
    completed = [t for t in trips if t.status == "completed"]

    total_dist = sum(t.distance for t in trips) / 1000
    total_dur = sum(t.duration for t in trips) / 3600
    max_speed = max((t.max_speed for t in trips), default=0.0)
    avg_speed = (
        sum(t.avg_speed for t in completed) / len(completed)
        if completed else 0.0
    )

    sorted_by_dist = sorted(trips, key=lambda t: t.distance, reverse=True)
    longest = sorted_by_dist[0] if sorted_by_dist else None

    last_trip = trips[-1]  # already ordered asc, so last is most recent

    return UserStatsOut(
        user_id=user_id,
        username=username,
        trip_count=len(trips),
        completed_trip_count=len(completed),
        total_distance_km=round(total_dist, 2),
        total_duration_hours=round(total_dur, 2),
        all_time_max_speed=round(max_speed, 1),
        avg_speed_overall=round(avg_speed, 1),
        first_trip_at=trips[0].started_at,
        last_trip_at=last_trip.started_at,
        last_trip_name=last_trip.name or None,
        longest_trip_km=round((longest.distance / 1000) if longest else 0, 2),
        longest_trip_name=longest.name if longest else None,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get(
    "/stats",
    response_model=GlobalStatsOut,
    summary="Global platform statistics",
)
def global_stats(db: Session = Depends(get_db)):
    """Overview of the entire platform — users, trips, records."""
    all_trips = db.query(Trip).all()
    if not all_trips:
        return GlobalStatsOut(
            total_users=0, total_trips=0, total_distance_km=0,
            total_duration_hours=0, all_time_max_speed=0,
            all_time_max_speed_user="—", most_trips_user="—",
            most_trips_count=0, most_distance_user="—", most_distance_km=0,
        )

    # Unique users
    user_ids = list({t.user_id for t in all_trips})

    # Totals
    total_dist = sum(t.distance for t in all_trips) / 1000
    total_dur = sum(t.duration for t in all_trips) / 3600

    # All-time record speed
    fastest_trip = max(all_trips, key=lambda t: t.max_speed)

    # Most trips
    from collections import Counter
    trips_per_user = Counter(t.user_id for t in all_trips)
    top_trips_uid, top_trips_count = trips_per_user.most_common(1)[0]
    top_trips_username = next(
        (t.username for t in all_trips if t.user_id == top_trips_uid), top_trips_uid
    )

    # Most distance
    dist_per_user: dict[str, float] = {}
    for t in all_trips:
        dist_per_user[t.user_id] = dist_per_user.get(t.user_id, 0) + t.distance
    top_dist_uid = max(dist_per_user, key=lambda uid: dist_per_user[uid])
    top_dist_km = round(dist_per_user[top_dist_uid] / 1000, 2)
    top_dist_username = next(
        (t.username for t in all_trips if t.user_id == top_dist_uid), top_dist_uid
    )

    return GlobalStatsOut(
        total_users=len(user_ids),
        total_trips=len(all_trips),
        total_distance_km=round(total_dist, 2),
        total_duration_hours=round(total_dur, 2),
        all_time_max_speed=round(fastest_trip.max_speed, 1),
        all_time_max_speed_user=fastest_trip.username or fastest_trip.user_id,
        most_trips_user=top_trips_username,
        most_trips_count=top_trips_count,
        most_distance_user=top_dist_username,
        most_distance_km=top_dist_km,
    )


@router.get(
    "/users",
    response_model=list[UserStatsOut],
    summary="List all users with statistics",
)
def list_users(
    sort_by: str = Query(
        default="last_trip_at",
        description="Sort field: last_trip_at | trip_count | total_distance_km | all_time_max_speed",
    ),
    db: Session = Depends(get_db),
):
    """
    Returns one row per unique user with aggregated stats.
    Sorted by `sort_by` descending.
    """
    # Get distinct user IDs
    user_ids: list[str] = [
        row[0] for row in db.query(Trip.user_id).distinct().all()
    ]

    stats = []
    for uid in user_ids:
        s = _build_user_stats(uid, db)
        if s:
            stats.append(s)

    # Sort
    sort_map = {
        "last_trip_at": lambda s: s.last_trip_at or datetime.min,
        "trip_count": lambda s: s.trip_count,
        "total_distance_km": lambda s: s.total_distance_km,
        "all_time_max_speed": lambda s: s.all_time_max_speed,
    }
    key_fn = sort_map.get(sort_by, sort_map["last_trip_at"])
    stats.sort(key=key_fn, reverse=True)

    return stats


@router.get(
    "/users/{user_id}",
    response_model=UserStatsOut,
    summary="Detailed stats for one user",
)
def get_user_stats(user_id: str, db: Session = Depends(get_db)):
    """Full stats card for a specific Telegram user ID."""
    stats = _build_user_stats(user_id, db)
    if not stats:
        raise HTTPException(status_code=404, detail="User not found")
    return stats


@router.get(
    "/users/{user_id}/trips",
    response_model=Paginated[TripOut],
    summary="All trips for a user (admin view, includes private)",
)
def get_user_trips_admin(
    user_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(PAGE_SIZE, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Returns ALL trips (including private) for the given user."""
    q = (
        db.query(Trip)
        .filter(Trip.user_id == user_id)
        .order_by(Trip.started_at.desc())
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


@router.delete(
    "/users/{user_id}/trips",
    status_code=204,
    summary="Delete ALL trips for a user",
)
def delete_user_trips(user_id: str, db: Session = Depends(get_db)):
    """Hard-delete all trips and segments for a user (GDPR / moderation)."""
    deleted = db.query(Trip).filter(Trip.user_id == user_id).delete()
    db.commit()
    if deleted == 0:
        raise HTTPException(status_code=404, detail="User not found or no trips")


@router.delete(
    "/trips/{trip_id}",
    status_code=204,
    summary="Delete a specific trip (admin override)",
)
def admin_delete_trip(trip_id: str, db: Session = Depends(get_db)):
    """Delete any trip regardless of owner (moderation)."""
    trip = db.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db.delete(trip)
    db.commit()
