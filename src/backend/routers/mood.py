import time
from fastapi import APIRouter, HTTPException

from backend.models.mood import (
    MOOD_EMOTIONS,
    MOOD_STATES,
    Mood,
    MoodLog,
    get_fresh_emotion_counts,
    get_fresh_mood_counts,
)

mood_router = APIRouter(prefix="/api", tags=["api"])

@mood_router.get("/mood", tags=["mood"])
async def get_pet_mood(tg_id: int):
    mood = await Mood.get_or_none(pet_id=tg_id)
    if not mood:
        return {
            "pet_id": tg_id,
            "state": None,
            "emotion": None,
            "counts": get_fresh_mood_counts(),
            "emotion_counts": get_fresh_emotion_counts(),
            "client_recorded_at": None,
            "updated_at": 0.0,
            "logs": [],
        }

    counts = dict(mood.counts or {})
    for s in MOOD_STATES:
        counts.setdefault(s, 0)

    emotion_counts = dict(mood.emotion_counts or {})
    for e in MOOD_EMOTIONS:
        emotion_counts.setdefault(e, 0)

    logs = (
        await MoodLog.filter(mood=mood)
        .order_by("-server_timestamp", "-id")
        .limit(20)
        .values("id", "state", "emotion", "recorded_at_client", "server_timestamp")
    )

    return {
        "id": mood.id,
        "pet_id": tg_id,
        "state": mood.state,
        "emotion": mood.emotion,
        "counts": counts,
        "emotion_counts": emotion_counts,
        "client_recorded_at": mood.client_recorded_at,
        "updated_at": mood.updated_at,
        "logs": logs,
    }
@mood_router.post("/mood", tags=["mood"])
async def record_pet_mood(
    tg_id: int,
    state: str,
    client_time: str,
    emotion: str | None = None,
):
    if state not in MOOD_STATES:
        raise HTTPException(status_code=400, detail="Invalid mood state")

    if emotion is not None and emotion not in MOOD_EMOTIONS:
        raise HTTPException(status_code=400, detail="Invalid mood emotion")

    now_ts = time.time()
    mood, _ = await Mood.get_or_create(
        pet_id=tg_id,
        defaults={
            "state": state,
            "emotion": emotion,
            "counts": get_fresh_mood_counts(),
            "emotion_counts": get_fresh_emotion_counts(),
            "updated_at": now_ts,
        },
    )

    counts = dict(mood.counts or {})
    for s in MOOD_STATES:
        counts.setdefault(s, 0)
    counts[state] += 1

    emotion_counts = dict(mood.emotion_counts or {})
    for e in MOOD_EMOTIONS:
        emotion_counts.setdefault(e, 0)
    if emotion is not None:
        emotion_counts[emotion] += 1

    mood.state = state
    if emotion is not None:
        mood.emotion = emotion
    mood.counts = counts
    mood.emotion_counts = emotion_counts
    mood.client_recorded_at = client_time
    mood.updated_at = now_ts

    await mood.save(
        update_fields=[
            "state",
            "emotion",
            "counts",
            "emotion_counts",
            "client_recorded_at",
            "updated_at",
        ]
    )

    await MoodLog.create(
        mood=mood,
        state=state,
        emotion=emotion,
        recorded_at_client=client_time,
        server_timestamp=now_ts,
    )

    return mood