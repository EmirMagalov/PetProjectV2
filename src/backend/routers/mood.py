from fastapi import APIRouter
import time
from fastapi import HTTPException
from backend.models.mood import MOOD_STATES,Mood,MoodLog

mood_router = APIRouter(prefix="/api", tags=["api"])


@mood_router.post("/mood/", tags=["mood"])
async def record_pet_mood(tg_id: int, state: str, client_time: str):
    if state not in MOOD_STATES:
        raise HTTPException(status_code=400, detail="Invalid mood state")

    now_ts = time.time()
    mood, _ = await Mood.get_or_create(
        pet_id=tg_id,
        defaults={"state": state, "updated_at": now_ts},
    )

    counts = dict(mood.counts or {})
    for s in MOOD_STATES:
        counts.setdefault(s, 0)
    counts[state] += 1

    mood.state = state
    mood.counts = counts
    mood.client_recorded_at = client_time
    mood.updated_at = now_ts
    await mood.save(update_fields=["state", "counts", "client_recorded_at", "updated_at"])

    await MoodLog.create(
        mood=mood,
        state=state,
        recorded_at_client=client_time,
        server_timestamp=now_ts,
    )

    return mood