import logging
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import test
from app.core.config import settings
from app.db.session import init_models
from app.routers import auth, documents, family, history, profile
from app.services import storage

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_models()  # use Alembic migrations in production
    if not storage.is_configured():  # auth, family, etc. keep working; uploads report 503 until it is set
        log.warning("Cloudinary is not configured (CLOUDINARY_* in .env); document uploads will fail until it is.")
    yield


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api/v1")
api.include_router(auth.router)
api.include_router(family.router)
api.include_router(documents.router)
api.include_router(history.router)
api.include_router(profile.router)
app.include_router(api)
app.include_router(test.router)

@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok"}

@app.get("/")
def home():
    return {"status": "Hello World!"}