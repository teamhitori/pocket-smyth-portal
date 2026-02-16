from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, me, users, system

app = FastAPI(
    title="Pocket Smyth Control Plane API",
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(me.router, prefix="/api/me", tags=["user"])
app.include_router(users.router, prefix="/api/users", tags=["admin"])
app.include_router(system.router, prefix="/api/system", tags=["admin"])
