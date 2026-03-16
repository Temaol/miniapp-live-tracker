from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_tables
from routers import segments, trips, users

app = FastAPI(
    title="TripRoute API",
    version="0.1.0",
    description="POC backend for the TripRoute Telegram Mini App",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# In production lock this down to your Mini App domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(trips.router)
app.include_router(segments.router)
app.include_router(users.router)


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    create_tables()


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
