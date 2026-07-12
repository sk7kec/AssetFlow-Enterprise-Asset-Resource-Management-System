"""
Counter service for auto-generating sequential IDs.
Generates asset tags: AF-0001, AF-0002, AF-0003, etc.
"""

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import Collections


class CounterService:
    """Atomic counter for auto-incrementing sequences."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.counters = db[Collections.COUNTERS]

    async def get_next_sequence(self, name: str, prefix: str = "", pad: int = 4) -> str:
        """
        Atomically increment counter and return formatted sequence.
        Example: get_next_sequence("asset_tag", "AF-", 4) -> "AF-0001"
        """
        result = await self.counters.find_one_and_update(
            {"_id": name},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=True,
        )
        seq = result["seq"]
        return f"{prefix}{str(seq).zfill(pad)}"
