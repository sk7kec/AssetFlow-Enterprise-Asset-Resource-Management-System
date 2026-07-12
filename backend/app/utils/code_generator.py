"""
QR Code and Barcode generation utilities.
Generates images for asset tags and stores them locally or on Cloudinary.
"""

import io
import os
from pathlib import Path

import barcode
import qrcode
from barcode.writer import ImageWriter

from app.config import get_settings

settings = get_settings()


def generate_qr_code(data: str, filename: str) -> str:
    """
    Generate QR code image for asset tag data.
    Returns the file path/URL of the generated image.
    """
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    upload_dir = Path(settings.upload_dir) / "qr"
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / f"{filename}.png"
    img.save(str(file_path))

    return f"/{settings.upload_dir}/qr/{filename}.png"


def generate_barcode(data: str, filename: str) -> str:
    """
    Generate Code128 barcode image for asset tag.
    Returns the file path/URL of the generated image.
    """
    code128 = barcode.get_barcode_class("code128")
    barcode_instance = code128(data, writer=ImageWriter())

    upload_dir = Path(settings.upload_dir) / "barcodes"
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / filename
    saved_path = barcode_instance.save(str(file_path))

    # barcode library appends .png automatically
    relative = saved_path.replace("\\", "/")
    if not relative.startswith("/"):
        relative = f"/{relative}"

    return relative
