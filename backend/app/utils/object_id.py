"""
ObjectId validation and serialization helpers.
Ensures safe handling of MongoDB ObjectIds in API layer.
"""

from typing import Any, Dict, Optional

from bson import ObjectId
from fastapi import HTTPException, status


def validate_object_id(id_str: str, field_name: str = "id") -> ObjectId:
    """
    Validate and convert string to ObjectId.
    Raises HTTPException 400 if invalid.
    """
    if not ObjectId.is_valid(id_str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name} format",
        )
    return ObjectId(id_str)


def serialize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Convert MongoDB document ObjectIds to strings for JSON serialization.
    Recursively handles nested documents and lists.
    """
    if doc is None:
        return None

    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, dict):
            result[key] = serialize_doc(value)
        elif isinstance(value, list):
            result[key] = [
                serialize_doc(item) if isinstance(item, dict)
                else str(item) if isinstance(item, ObjectId)
                else item
                for item in value
            ]
        else:
            result[key] = value

    # Always expose 'id' from '_id'
    if "_id" in result:
        result["id"] = result.pop("_id")

    return result
