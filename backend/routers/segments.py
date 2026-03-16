from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Segment
from schemas import Paginated, SegmentCreate, SegmentOut

router = APIRouter(prefix="/segments", tags=["segments"])

PAGE_SIZE = 20


def _seg_to_out(s: Segment) -> SegmentOut:
    return SegmentOut(
        id=s.id,
        trip_id=s.trip_id,
        user_id=s.user_id,
        username=s.username,
        name=s.name,
        start_lat=s.start_lat,
        start_lng=s.start_lng,
        end_lat=s.end_lat,
        end_lng=s.end_lng,
        distance=s.distance,
        duration=s.duration,
        avg_speed=s.avg_speed,
        max_speed=s.max_speed,
        path=s.path,
        is_public=s.is_public,
        created_at=s.created_at,
    )


@router.post("", status_code=status.HTTP_201_CREATED, response_model=SegmentOut)
def create_segment(
    body: SegmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if str(body.user_id) != str(current_user["id"]):
        raise HTTPException(status_code=403, detail="Forbidden")

    existing = db.get(Segment, body.id)
    if existing:
        raise HTTPException(status_code=409, detail="Segment already exists")

    seg = Segment(
        id=body.id,
        trip_id=body.trip_id,
        user_id=str(body.user_id),
        username=body.username,
        name=body.name,
        start_lat=body.start_lat,
        start_lng=body.start_lng,
        end_lat=body.end_lat,
        end_lng=body.end_lng,
        distance=body.distance,
        duration=body.duration,
        avg_speed=body.avg_speed,
        max_speed=body.max_speed,
        is_public=body.is_public,
    )
    seg.path = [c.model_dump() for c in body.path]
    db.add(seg)
    db.commit()
    db.refresh(seg)
    return _seg_to_out(seg)


@router.get("/public", response_model=Paginated[SegmentOut])
def list_public_segments(
    page: int = Query(1, ge=1),
    page_size: int = Query(PAGE_SIZE, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Public leaderboard-style segments feed."""
    q = (
        db.query(Segment)
        .filter(Segment.is_public.is_(True))
        .order_by(Segment.max_speed.desc())
    )
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return Paginated(
        items=[_seg_to_out(s) for s in items],
        total=total,
        page=page,
        page_size=page_size,
        has_more=(page * page_size) < total,
    )


@router.get("/{segment_id}", response_model=SegmentOut)
def get_segment(segment_id: str, db: Session = Depends(get_db)):
    seg = db.get(Segment, segment_id)
    if not seg:
        raise HTTPException(status_code=404, detail="Segment not found")
    if not seg.is_public:
        raise HTTPException(status_code=403, detail="Forbidden")
    return _seg_to_out(seg)
