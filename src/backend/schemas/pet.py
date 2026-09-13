from pydantic import BaseModel

class PetSyncRequest(BaseModel):
    tg_id: int

class PetResponse(BaseModel):
    tg_id: int
    foodLevel: int
    energy: int
    last_update: float

