"""
QR Code and Barcode generation utilities for AssetFlow.

Generates:
  - QR codes (PNG) per asset for mobile scanning
  - Code128 barcodes (PNG) for warehouse label printing
  - Auto asset tag sequences (AF-000001, AF-000002, ...)

All outputs are saved to the local uploads/codes/ directory
and the file path is returned for storage in the database.
"""

import io
import os
from pathlib import Path
from typing import Optional, Tuple

from app.config import get_settings
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)


def _ensure_code_dir(subfolder: str) -> Path:
    """Create the target directory for generated code images."""
    base = Path(settings.upload_dir) / "codes" / subfolder
    base.mkdir(parents=True, exist_ok=True)
    return base


def generate_qr_code(
    asset_tag: str,
    data: Optional[str] = None,
    size: int = 300,
) -> Tuple[str, bytes]:
    """
    Generate a QR code image for an asset.

    The QR code encodes either the provided data string or a default
    asset URL (e.g., for mobile redirect to the asset detail page).

    Args:
        asset_tag: Asset tag used as filename (e.g., "AF-000001")
        data: String to encode. Defaults to the asset tag itself.
        size: Image width/height in pixels

    Returns:
        Tuple of (relative URL path, PNG bytes)
    """
    import qrcode
    from PIL import Image

    qr_data = data or f"ASSETFLOW:{asset_tag}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)

    # Generate dark green on white QR code for visual identity
    img = qr.make_image(fill_color="#1a472a", back_color="white")

    # Resize to requested size
    img = img.resize((size, size), Image.LANCZOS)

    # Save to bytes buffer
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    png_bytes = buffer.read()

    # Persist to disk
    code_dir = _ensure_code_dir("qr")
    filename = f"{asset_tag}.png"
    file_path = code_dir / filename
    file_path.write_bytes(png_bytes)

    url = f"/{settings.upload_dir}/codes/qr/{filename}"
    logger.debug(f"QR code generated for {asset_tag}: {url}")
    return url, png_bytes


def generate_barcode(
    asset_tag: str,
    barcode_value: Optional[str] = None,
) -> Tuple[str, bytes]:
    """
    Generate a Code128 barcode image for an asset.

    Code128 is the industry-standard barcode format for asset labels.
    It can encode all ASCII characters, making it ideal for asset tags.

    Args:
        asset_tag: Asset tag used as filename (e.g., "AF-000001")
        barcode_value: Value to encode. Defaults to the asset tag.

    Returns:
        Tuple of (relative URL path, PNG bytes)
    """
    import barcode
    from barcode.writer import ImageWriter

    value = barcode_value or asset_tag

    # Use Code128 which supports alphanumeric asset tags
    code128_class = barcode.get_barcode_class("code128")
    code = code128_class(value, writer=ImageWriter())

    buffer = io.BytesIO()
    code.write(
        buffer,
        options={
            "module_width": 10,
            "module_height": 15,
            "quiet_zone": 6.5,
            "font_size": 10,
            "text_distance": 5,
            "background": "white",
            "foreground": "black",
            "write_text": True,
            "dpi": 200,
        },
    )
    buffer.seek(0)
    png_bytes = buffer.read()

    # Persist to disk
    code_dir = _ensure_code_dir("barcode")
    filename = f"{asset_tag}.png"
    file_path = code_dir / filename
    file_path.write_bytes(png_bytes)

    url = f"/{settings.upload_dir}/codes/barcode/{filename}"
    logger.debug(f"Barcode generated for {asset_tag}: {url}")
    return url, png_bytes


def generate_asset_codes(asset_tag: str) -> Tuple[str, str]:
    """
    Convenience function to generate both QR and barcode for a new asset.

    Called during asset registration to create both code images atomically.

    Args:
        asset_tag: The newly assigned asset tag (e.g., "AF-000001")

    Returns:
        Tuple of (qr_code_url, barcode_url) for storage in the asset document
    """
    try:
        qr_url, _ = generate_qr_code(asset_tag)
    except Exception as e:
        logger.error(f"Failed to generate QR code for {asset_tag}: {e}")
        qr_url = None

    try:
        barcode_url, _ = generate_barcode(asset_tag)
    except Exception as e:
        logger.error(f"Failed to generate barcode for {asset_tag}: {e}")
        barcode_url = None

    return qr_url, barcode_url
