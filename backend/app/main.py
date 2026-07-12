from fastapi import FastAPI

from app.routers.auth import router as auth_router
from app.routers.department import router as department_router

app = FastAPI(title="AssetFlow API")

app.include_router(auth_router)
app.include_router(department_router)

@app.get("/")
def home():
    return {
        "message": "AssetFlow Backend Running"
    }