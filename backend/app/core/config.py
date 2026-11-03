import os
from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env
load_dotenv()


class Settings:
    """Configuración centralizada del microservicio Backend TechAssist AI."""

    PROJECT_NAME: str = "TechAssist AI - Backend Enterprise Service"
    VERSION: str = "2.4.0"

    # Conexión principal a PostgreSQL (Puerto 5433 para no interferir con otros contenedores en 5432)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://techassist_user:techassist_password@127.0.0.1:5433/techassist_db",
    )

    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))

    # Claves opcionales para motores LLM externos (Modo Híbrido)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "").strip()

    # Usuario de auditoría por defecto para procesos automáticos del sistema
    SYSTEM_AUDIT_USER: str = "SYSTEM_DAEMON"


settings = Settings()

