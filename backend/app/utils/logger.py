"""
Structured logging setup for AssetFlow.
Provides JSON-formatted logs with file rotation and console output.
All modules import the logger from here for consistency.
"""

import logging
import logging.handlers
import os
import sys
from pathlib import Path
from typing import Optional

from app.config import get_settings

settings = get_settings()


def _get_log_level(level_str: str) -> int:
    """Convert string log level to logging constant."""
    levels = {
        "DEBUG": logging.DEBUG,
        "INFO": logging.INFO,
        "WARNING": logging.WARNING,
        "ERROR": logging.ERROR,
        "CRITICAL": logging.CRITICAL,
    }
    return levels.get(level_str.upper(), logging.INFO)


class JsonFormatter(logging.Formatter):
    """
    JSON-structured log formatter for machine-readable log ingestion.
    Compatible with log aggregation tools (Datadog, ELK, Cloud Logging).
    """

    def format(self, record: logging.LogRecord) -> str:
        import json
        from datetime import datetime, timezone

        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Attach exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Attach extra fields passed via logging context
        for key, value in record.__dict__.items():
            if key not in (
                "args", "asctime", "created", "exc_info", "exc_text",
                "filename", "funcName", "id", "levelname", "levelno",
                "lineno", "module", "msecs", "message", "msg", "name",
                "pathname", "process", "processName", "relativeCreated",
                "stack_info", "thread", "threadName",
            ):
                log_data[key] = value

        return json.dumps(log_data, default=str)


def setup_logger(name: str = "assetflow") -> logging.Logger:
    """
    Create and configure a structured logger.

    Args:
        name: Logger name / namespace

    Returns:
        Configured logging.Logger instance
    """
    logger = logging.getLogger(name)

    if logger.handlers:
        # Avoid duplicate handlers if called multiple times
        return logger

    log_level = _get_log_level(settings.log_level)
    logger.setLevel(log_level)

    # ─── Console Handler ─────────────────────────────────────────────
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)

    if settings.is_production:
        # Machine-readable JSON in production
        console_handler.setFormatter(JsonFormatter())
    else:
        # Human-readable format in development
        console_fmt = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        console_handler.setFormatter(console_fmt)

    logger.addHandler(console_handler)

    # ─── File Handler (rotating) ──────────────────────────────────────
    log_dir = Path(settings.log_dir)
    log_dir.mkdir(parents=True, exist_ok=True)

    log_file = log_dir / "assetflow.log"
    file_handler = logging.handlers.RotatingFileHandler(
        filename=log_file,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(JsonFormatter())
    logger.addHandler(file_handler)

    # ─── Error File Handler ───────────────────────────────────────────
    error_log_file = log_dir / "errors.log"
    error_handler = logging.handlers.RotatingFileHandler(
        filename=error_log_file,
        maxBytes=5 * 1024 * 1024,  # 5 MB
        backupCount=3,
        encoding="utf-8",
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(JsonFormatter())
    logger.addHandler(error_handler)

    # Don't propagate to root logger (avoids duplicate logs)
    logger.propagate = False

    return logger


def get_logger(module_name: Optional[str] = None) -> logging.Logger:
    """
    Get a named child logger for a specific module.

    Usage:
        from app.utils.logger import get_logger
        logger = get_logger(__name__)
        logger.info("Something happened", extra={"user_id": "123"})
    """
    base_logger = setup_logger("assetflow")
    if module_name:
        return base_logger.getChild(module_name)
    return base_logger


# Module-level logger for direct import
logger = get_logger("app")
