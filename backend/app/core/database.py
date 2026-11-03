import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger("techassist.database")

# Declarative Base para todos los modelos ORM
Base = declarative_base()


def build_engine():
    """
    Construye el motor SQLAlchemy conectado a PostgreSQL.
    Configura pool_pre_ping para reconexión automática y manejo robusto de sesiones.
    """
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        echo=False,
    )
    return engine


engine = build_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """
    Dependencia de FastAPI para inyectar la sesión de base de datos en cada request
    y cerrarla automáticamente al finalizar la transacción.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

