"""
Pagination helper utilities.
Builds MongoDB queries with skip/limit and computes pagination metadata.
"""

import asyncio
import inspect
import math
from typing import Any, Callable, Dict, List, Optional, Tuple

from motor.motor_asyncio import AsyncIOMotorCollection

from app.schemas.common import PaginatedResponse, PaginationParams


def build_sort_criteria(sort_by: str, sort_order: str) -> List[Tuple[str, int]]:
    """Convert sort params to MongoDB sort criteria."""
    direction = -1 if sort_order == "desc" else 1
    return [(sort_by, direction)]


async def paginate(
    collection: AsyncIOMotorCollection,
    query: Dict[str, Any],
    params: PaginationParams,
    serializer: Callable,
) -> PaginatedResponse:
    """
    Generic pagination helper for any MongoDB collection.

    Args:
        collection: Motor collection reference
        query: MongoDB filter query
        params: Pagination parameters
        serializer: Function (sync or async) to convert MongoDB doc to response model
    """
    skip = (params.page - 1) * params.page_size
    sort_criteria = build_sort_criteria(params.sort_by, params.sort_order)

    total = await collection.count_documents(query)
    cursor = (
        collection.find(query)
        .sort(sort_criteria)
        .skip(skip)
        .limit(params.page_size)
    )

    docs = [doc async for doc in cursor]

    # Properly handle both sync and async serializers
    if inspect.iscoroutinefunction(serializer):
        items = list(await asyncio.gather(*[serializer(doc) for doc in docs]))
    else:
        items = [serializer(doc) for doc in docs]

    total_pages = math.ceil(total / params.page_size) if params.page_size > 0 else 0

    return PaginatedResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=total_pages,
        has_next=params.page < total_pages,
        has_prev=params.page > 1,
    )


def build_search_filter(
    search: Optional[str],
    fields: List[str],
) -> Dict[str, Any]:
    """Build MongoDB text search or regex filter across multiple fields."""
    if not search:
        return {}

    # Use $or with case-insensitive regex for flexible search
    return {
        "$or": [
            {field: {"$regex": search, "$options": "i"}}
            for field in fields
        ]
    }
