"""
MongoDB Atlas connection using Motor (async driver).
Provides database instance and collection helpers.
"""

from datetime import datetime, timezone
from typing import Optional

import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import get_settings


settings = get_settings()

# Global client and database references
_client: Optional[AsyncIOMotorClient] = None
_database: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongodb() -> None:
    """
    Establish connection to MongoDB Atlas on application startup.
    Called from FastAPI lifespan event.
    """
    global _client, _database

    _client = AsyncIOMotorClient(
        settings.mongodb_url,
        maxPoolSize=50,
        minPoolSize=10,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=10000,
    )
    _database = _client[settings.mongodb_db_name]

    # Verify connection is alive
    await _client.admin.command("ping")
    print(f"✅ Connected to MongoDB Atlas: {settings.mongodb_db_name}")


async def close_mongodb_connection() -> None:
    """Close MongoDB connection on application shutdown."""
    global _client, _database

    if _client is not None:
        _client.close()
        _client = None
        _database = None
        print("🔌 MongoDB connection closed")


def get_database() -> AsyncIOMotorDatabase:
    """
    Return the active database instance.
    Raises RuntimeError if called before connection is established.
    """
    if _database is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongodb() first.")
    return _database


# Collection name constants - single source of truth
class Collections:
    USERS = "users"
    DEPARTMENTS = "departments"
    EMPLOYEES = "employees"
    ROLES = "roles"
    ASSET_CATEGORIES = "asset_categories"
    ASSETS = "assets"
    ASSET_HISTORY = "asset_history"
    ALLOCATIONS = "allocations"
    ALLOCATION_HISTORY = "allocation_history"
    BOOKINGS = "bookings"
    MAINTENANCE_REQUESTS = "maintenance_requests"
    MAINTENANCE_HISTORY = "maintenance_history"
    AUDIT_CYCLES = "audit_cycles"
    AUDIT_VERIFICATIONS = "audit_verifications"
    NOTIFICATIONS = "notifications"
    ACTIVITY_LOGS = "activity_logs"
    COUNTERS = "counters"
    PASSWORD_RESET_TOKENS = "password_reset_tokens"


async def create_indexes() -> None:
    """
    Create database indexes for performance and uniqueness constraints.
    Run once on startup.
    """
    db = get_database()

    # Users
    await db[Collections.USERS].create_index("email", unique=True)
    await db[Collections.USERS].create_index("employee_id")

    # Departments
    await db[Collections.DEPARTMENTS].create_index("code", unique=True)
    await db[Collections.DEPARTMENTS].create_index("name")

    # Employees
    await db[Collections.EMPLOYEES].create_index("employee_code", unique=True)
    await db[Collections.EMPLOYEES].create_index("user_id")
    await db[Collections.EMPLOYEES].create_index("department_id")

    # Roles
    await db[Collections.ROLES].create_index("name", unique=True)

    # Asset Categories
    await db[Collections.ASSET_CATEGORIES].create_index("name", unique=True)

    # Assets
    await db[Collections.ASSETS].create_index("asset_tag", unique=True)
    await db[Collections.ASSETS].create_index("serial_number", unique=True)
    await db[Collections.ASSETS].create_index("category_id")
    await db[Collections.ASSETS].create_index("status")
    await db[Collections.ASSETS].create_index([("name", "text"), ("asset_tag", "text")])

    # Allocations
    await db[Collections.ALLOCATIONS].create_index("asset_id")
    await db[Collections.ALLOCATIONS].create_index("employee_id")
    await db[Collections.ALLOCATIONS].create_index("status")

    # Bookings
    await db[Collections.BOOKINGS].create_index("resource_id")
    await db[Collections.BOOKINGS].create_index("start_time")
    await db[Collections.BOOKINGS].create_index("status")

    # Maintenance
    await db[Collections.MAINTENANCE_REQUESTS].create_index("asset_id")
    await db[Collections.MAINTENANCE_REQUESTS].create_index("status")

    # Audit
    await db[Collections.AUDIT_CYCLES].create_index("status")
    await db[Collections.AUDIT_VERIFICATIONS].create_index("audit_cycle_id")

    # Notifications
    await db[Collections.NOTIFICATIONS].create_index("user_id")
    await db[Collections.NOTIFICATIONS].create_index([("user_id", 1), ("is_read", 1)])

    # Activity Logs
    await db[Collections.ACTIVITY_LOGS].create_index("user_id")
    await db[Collections.ACTIVITY_LOGS].create_index("created_at")
    await db[Collections.ACTIVITY_LOGS].create_index("module")

    # Password Reset Tokens
    await db[Collections.PASSWORD_RESET_TOKENS].create_index("token", unique=True)
    await db[Collections.PASSWORD_RESET_TOKENS].create_index(
        "expires_at", expireAfterSeconds=0
    )

    print("✅ Database indexes created")


async def seed_initial_data() -> None:
    """
    Seed the database with default users and asset categories on first startup.
    Idempotent — safe to call multiple times; skips existing records.
    """
    db = get_database()
    now = datetime.now(timezone.utc)

    # ── Default Users ────────────────────────────────────────────
    default_users = [
        {
            "email": "admin@assetflow.com",
            "full_name": "System Administrator",
            "role": "admin",
            "password": "Admin@123",
        },
        {
            "email": "manager@assetflow.com",
            "full_name": "Asset Manager",
            "role": "asset_manager",
            "password": "Manager@123",
        },
        {
            "email": "depthead@assetflow.com",
            "full_name": "Department Head",
            "role": "department_head",
            "password": "Dept@123",
        },
        {
            "email": "employee@assetflow.com",
            "full_name": "Standard Employee",
            "role": "employee",
            "password": "Employee@123",
        },
    ]

    users_created = 0
    for u in default_users:
        email_clean = u["email"].strip().lower()
        existing = await db[Collections.USERS].find_one({"email": {"$regex": f"^{email_clean}$", "$options": "i"}})
        if not existing:
            hashed = bcrypt.hashpw(u["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            await db[Collections.USERS].insert_one({
                "email": u["email"],
                "full_name": u["full_name"],
                "hashed_password": hashed,
                "role": u["role"],
                "is_active": True,
                "phone": None,
                "employee_id": None,
                "created_at": now,
                "updated_at": now,
            })
            users_created += 1

    if users_created:
        print(f"✅ Seeded {users_created} default user(s)")

    # ── Default Asset Categories ─────────────────────────────────
    default_categories = [
        {"name": "Computing & Laptops",     "description": "Laptops, desktops, workstations, and personal computing devices"},
        {"name": "Mobile Devices",          "description": "Smartphones, tablets, and portable communication devices"},
        {"name": "Networking Equipment",    "description": "Routers, switches, access points, modems, and network infrastructure"},
        {"name": "Printers & Peripherals",  "description": "Printers, scanners, monitors, keyboards, mice, and accessories"},
        {"name": "Audio & Video Equipment", "description": "Projectors, cameras, conference room AV systems, and displays"},
        {"name": "Office Furniture",        "description": "Desks, chairs, cabinets, shelving units, and workspace fixtures"},
        {"name": "Servers & Storage",       "description": "Rack servers, NAS devices, SAN systems, and data storage hardware"},
        {"name": "Software Licenses",       "description": "Enterprise software licenses, subscriptions, and digital assets"},
        {"name": "Power & Electrical",      "description": "UPS units, PDUs, generators, and electrical infrastructure"},
        {"name": "Vehicles & Transport",    "description": "Company vehicles, forklifts, and transportation equipment"},
    ]

    cats_created = 0
    for cat in default_categories:
        cat_clean = cat["name"].strip()
        existing = await db[Collections.ASSET_CATEGORIES].find_one({"name": {"$regex": f"^{cat_clean}$", "$options": "i"}})
        if not existing:
            await db[Collections.ASSET_CATEGORIES].insert_one({
                "name": cat["name"],
                "description": cat["description"],
                "depreciation_years": None,
                "warranty_months": None,
                "requires_serial_number": True,
                "is_bookable": False,
                "custom_fields": [],
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            })
            cats_created += 1

    if cats_created:
        print(f"✅ Seeded {cats_created} default asset categorie(s)")

