"""
AssetFlow FastAPI Application Entry Point.

Registers all routers, middleware, lifespan events, static files,
and Swagger/OpenAPI documentation configuration.

All 15 modules are wired here:
  Part 1  - Auth (/api/v1/auth)
  Part 2  - Organization (/api/v1/organization)
  Part 3  - Asset Categories (included in /api/v1 via assets router)
  Part 4  - Assets (/api/v1/assets, /api/v1/asset-categories)
  Part 5  - Allocations (/api/v1/allocations)
  Part 6  - Bookings (/api/v1/bookings)
  Part 7  - Maintenance (/api/v1/maintenance)
  Part 8  - Audits (/api/v1/audits)
  Part 9  - Dashboard (/api/v1/dashboard)
  Part 10 - Notifications (/api/v1/notifications)
  Part 11 - Reports (/api/v1/reports)
  Part 12 - Activity Logs (within /api/v1/organization)
  Part 13 - Uploads (/api/v1/uploads)
  Part 14 - Search (/api/v1/search)
  Part 15 - Deployment (Dockerfile, docker-compose.yml)
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import get_settings
from app.database import close_mongodb_connection, connect_to_mongodb, create_indexes, seed_initial_data
from app.middleware.role_middleware import RequestLoggingMiddleware, RoleMiddleware
from app.utils.logger import get_logger

# Import all routers
from app.routers import auth, organization
from app.routers.assets import asset_router, category_router
from app.routers.allocations import router as allocations_router
from app.routers.bookings import router as bookings_router
from app.routers.maintenance import router as maintenance_router
from app.routers.audits import router as audits_router
from app.routers.dashboard import router as dashboard_router
from app.routers.notifications import router as notifications_router
from app.routers.reports import router as reports_router
from app.routers.search import router as search_router
from app.routers.uploads import router as uploads_router

settings = get_settings()
logger = get_logger("main")

# Rate limiter keyed by client IP
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle.

    Startup:
      1. Connect to MongoDB Atlas
      2. Create indexes
      3. Seed default system roles
      4. Ensure upload directories exist

    Shutdown:
      1. Close MongoDB connection
    """
    # ── Startup ──────────────────────────────────────────────────────
    logger.info("🚀 AssetFlow backend starting up...")

    await connect_to_mongodb()
    await create_indexes()
    await seed_initial_data()

    # Seed system roles
    from app.database import get_database
    from app.services.role_service import RoleService
    role_service = RoleService(get_database())
    await role_service.seed_system_roles()

    # Ensure upload directories exist
    for subdir in ["images", "documents", "codes/qr", "codes/barcode", "maintenance"]:
        Path(settings.upload_dir, subdir).mkdir(parents=True, exist_ok=True)

    logger.info(f"✅ {settings.app_name} v{settings.app_version} started [{settings.app_env}]")

    yield

    # ── Shutdown ─────────────────────────────────────────────────────
    logger.info("🔌 Shutting down AssetFlow backend...")
    await close_mongodb_connection()
    logger.info("✅ Shutdown complete")


# ─── FastAPI Application ──────────────────────────────────────────

app = FastAPI(
    title=settings.app_name,
    description=(
        "## AssetFlow – Enterprise Asset & Resource Management API\n\n"
        "A comprehensive ERP backend for managing company assets, "
        "allocations, bookings, maintenance, audits, and reporting.\n\n"
        "### Authentication\n"
        "Use the **Authorize** button above to enter your JWT token. "
        "Obtain tokens from the `/api/v1/auth/login` endpoint.\n\n"
        "### Modules\n"
        "- 🔐 **Auth** — Registration, login, JWT, password reset\n"
        "- 🏢 **Organization** — Departments, employees, roles\n"
        "- 📦 **Assets** — Full asset lifecycle with QR/barcode\n"
        "- 🔄 **Allocations** — Allocate, return, transfer assets\n"
        "- 📅 **Bookings** — Room, vehicle, equipment reservations\n"
        "- 🔧 **Maintenance** — Request, approve, assign, resolve\n"
        "- 🔍 **Audits** — Audit cycles, verification, discrepancy reports\n"
        "- 📊 **Dashboard** — KPIs, charts, statistics\n"
        "- 🔔 **Notifications** — Real-time in-app notifications\n"
        "- 📈 **Reports** — PDF, Excel, CSV exports\n"
        "- 🔎 **Search** — Global cross-module search\n"
        "- 📁 **Uploads** — Image and document file management\n"
    ),
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "Health", "description": "Health check and status endpoints"},
        {"name": "Authentication", "description": "JWT auth: signup, login, refresh, password reset"},
        {"name": "Organization", "description": "Departments, employees, roles, and activity logs"},
        {"name": "Asset Categories", "description": "Asset category CRUD (Admin only)"},
        {"name": "Assets", "description": "Asset registration, updates, QR/barcode, lifecycle"},
        {"name": "Allocations", "description": "Asset allocation, return, and transfer workflows"},
        {"name": "Bookings", "description": "Room, vehicle, equipment reservations with calendar"},
        {"name": "Maintenance", "description": "Maintenance requests, approval workflow, technician assignment"},
        {"name": "Audits", "description": "Asset audit cycles, verification, discrepancy reports"},
        {"name": "Dashboard", "description": "KPIs, charts, and operational statistics"},
        {"name": "Notifications", "description": "In-app notification management"},
        {"name": "Reports", "description": "Reports with PDF, Excel, and CSV export"},
        {"name": "Global Search", "description": "Cross-module unified search"},
        {"name": "File Uploads", "description": "Image and document upload management"},
    ],
    swagger_ui_parameters={
        "persistAuthorization": True,
        "defaultModelsExpandDepth": -1,
        "docExpansion": "none",
        "filter": True,
    },
)

# ─── Rate Limiting ────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── Custom Middleware ────────────────────────────────────────────
app.add_middleware(RoleMiddleware)
app.add_middleware(RequestLoggingMiddleware)


# ─── CORS ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


# ─── Security Headers ─────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Inject security headers on every response."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    return response


# ─── Global Exception Handler ─────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all exception handler.
    Shows full details in debug mode, generic message in production.
    """
    logger.exception(f"Unhandled exception on {request.method} {request.url}: {exc}")
    if settings.debug:
        return JSONResponse(
            status_code=500,
            content={
                "detail": str(exc),
                "type": type(exc).__name__,
                "path": str(request.url),
            },
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


# ─── Static Files (uploaded assets) ──────────────────────────────
uploads_dir = Path(settings.upload_dir)
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount(
    f"/{settings.upload_dir}",
    StaticFiles(directory=str(uploads_dir)),
    name="uploads",
)

# ─── Health Endpoints ─────────────────────────────────────────────
@app.get("/health", tags=["Health"], summary="Health check")
async def health_check():
    """
    Simple health check endpoint.
    Returns application name, version, and environment.
    Used by load balancers and orchestrators (Kubernetes, Docker Compose).
    """
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.app_env,
    }


@app.get("/", tags=["Health"], summary="API root")
async def root():
    """API root — returns welcome message and docs URL."""
    return {
        "message": f"Welcome to {settings.app_name} API",
        "version": settings.app_version,
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
    }


# ─── Router Registration ──────────────────────────────────────────
PREFIX = settings.api_prefix  # /api/v1

# Part 1: Auth
app.include_router(auth.router, prefix=PREFIX)

# Part 2: Organization (Departments, Employees, Roles, Activity Logs)
app.include_router(organization.router, prefix=PREFIX)

# Part 3 & 4: Asset Categories + Assets
app.include_router(category_router, prefix=PREFIX)
app.include_router(asset_router, prefix=PREFIX)

# Part 5: Allocations
app.include_router(allocations_router, prefix=PREFIX)

# Part 6: Bookings
app.include_router(bookings_router, prefix=PREFIX)

# Part 7: Maintenance
app.include_router(maintenance_router, prefix=PREFIX)

# Part 8: Audits
app.include_router(audits_router, prefix=PREFIX)

# Part 9: Dashboard
app.include_router(dashboard_router, prefix=PREFIX)

# Part 10: Notifications
app.include_router(notifications_router, prefix=PREFIX)

# Part 11: Reports
app.include_router(reports_router, prefix=PREFIX)

# Part 13: File Uploads
app.include_router(uploads_router, prefix=PREFIX)

# Part 14: Global Search
app.include_router(search_router, prefix=PREFIX)
