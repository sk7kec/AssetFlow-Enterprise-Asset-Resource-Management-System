"""
AssetFlow Development Server Runner.

Usage:
    python run.py              # Start with settings from .env
    python run.py --prod       # Production mode (no reload)
    python run.py --port 9000  # Custom port

Environment variables override .env file values.
"""

import argparse
import sys
from pathlib import Path

# Ensure the project root is on the Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="AssetFlow Backend Server")
    parser.add_argument("--host", default=None, help="Override host (default: from .env or 0.0.0.0)")
    parser.add_argument("--port", type=int, default=None, help="Override port (default: from .env or 8000)")
    parser.add_argument("--prod", action="store_true", help="Run in production mode (no reload, multiple workers)")
    parser.add_argument("--workers", type=int, default=1, help="Number of Uvicorn workers (prod mode)")
    return parser.parse_args()


def main():
    import uvicorn
    from app.config import get_settings

    args = parse_args()
    settings = get_settings()

    host = args.host or settings.host
    port = args.port or settings.port
    production = args.prod or settings.is_production

    print(f"\n{'='*60}")
    print(f"  🚀 Starting {settings.app_name} v{settings.app_version}")
    print(f"  📍 Environment : {settings.app_env}")
    print(f"  🌐 Server      : http://{host}:{port}")
    print(f"  📖 Swagger     : http://{host}:{port}/docs")
    print(f"  📘 ReDoc       : http://{host}:{port}/redoc")
    print(f"  ❤  Health      : http://{host}:{port}/health")
    print(f"  🗄  Database    : {settings.mongodb_db_name}")
    print(f"{'='*60}\n")

    uvicorn_config = {
        "app": "app.main:app",
        "host": host,
        "port": port,
        "log_level": settings.log_level.lower(),
    }

    if production:
        # Production: multiple workers, no reload
        uvicorn_config.update({
            "workers": args.workers,
            "reload": False,
            "proxy_headers": True,
            "forwarded_allow_ips": "*",
        })
        print(f"  ⚙  Mode        : PRODUCTION ({args.workers} workers)")
    else:
        # Development: single worker with hot reload
        uvicorn_config.update({
            "reload": True,
            "reload_dirs": ["app"],
        })
        print("  ⚙  Mode        : DEVELOPMENT (hot reload enabled)")

    print()
    uvicorn.run(**uvicorn_config)


if __name__ == "__main__":
    main()
