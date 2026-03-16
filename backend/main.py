from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from database import create_tables
from config import settings
from routers import segments, trips, users
from routers import admin

app = FastAPI(
    title="TripRoute API",
    version="0.1.1",
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
app.include_router(admin.router)


# ── Swagger: expose Admin API Key as a named security scheme ──────────────────
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    schema.setdefault("components", {}).setdefault("securitySchemes", {})
    schema["components"]["securitySchemes"]["AdminAPIKey"] = {
        "type": "apiKey",
        "in": "header",
        "name": "X-Admin-API-Key",
        "description": "Admin secret — set ADMIN_API_KEY env var on the server",
    }
    app.openapi_schema = schema
    return schema

app.openapi = custom_openapi  # type: ignore[method-assign]


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    create_tables()


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
