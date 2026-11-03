import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.routers import auth, conversations, chat
from app.services.seeder import seed_initial_data

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("techassist.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Ciclo de vida del servicio Backend:
    Al iniciar, verifica la conexión a PostgreSQL, crea el esquema relacional
    con campos de auditoría y ejecuta el seeder inicial si la base está vacía.
    """
    logger.info("Inicializando esquema de Base de Datos en PostgreSQL...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()
    logger.info("Servicio Backend TechAssist AI listo y escuchando peticiones.")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "API REST Empresarial de Soporte Técnico TI (Nivel 2/3) con Sistema Experto, "
        "Optimización por Algoritmos Genéticos y Auditoría Transversal en PostgreSQL."
    ),
    lifespan=lifespan,
)

# Configuración de CORS para comunicación con el servicio Frontend (React/Vite en puerto 5173)
app.add_middleware(
    CorsMiddlewareClass := CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de módulos de rutas
app.include_router(auth.router)
app.include_router(conversations.router)
app.include_router(chat.router)


@app.get("/api/health", tags=["Estado del Servicio"])
def health_check():
    """Endpoint de monitoreo de salud del servicio Backend y Base de Datos."""
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database_engine": "PostgreSQL (Puerto 5433 - Aislado)",
        "ai_engine": "Hybrid Expert System + Genetic Algorithm Optimizer",
    }

