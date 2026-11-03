from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    Float,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import AuditMixin


class Usuario(Base, AuditMixin):
    """
    Entidad de Técnicos y Especialistas de Soporte TI.
    ID numérico autoincremental (SERIAL) + 5 campos de auditoría (AuditMixin).
    Nunca se eliminan registros físicamente; se usa Borrado Lógico (status = 0).
    """

    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    nombre = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(100), nullable=False, default="Especialista de Soporte TI (N2)")
    departamento = Column(String(100), nullable=False, default="Infraestructura & Operaciones")
    iniciales = Column(String(5), nullable=False, default="TI")
    tier = Column(String(80), nullable=False, default="Nivel 2 - Redes & SysAdmin")

    # Relación 1:N con conversaciones (sin delete-orphan para preservar historial en soft delete)
    conversaciones = relationship("Conversacion", back_populates="usuario")


class Conversacion(Base, AuditMixin):
    """
    Entidad de Sesiones de Diagnóstico / Tickets de Conversación.
    ID numérico autoincremental (SERIAL) + 5 campos de auditoría (AuditMixin).
    Nunca se eliminan registros físicamente; al eliminar en la UI se cambia status = 0.
    """

    __tablename__ = "conversaciones"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    titulo = Column(String(200), nullable=False)
    categoria = Column(String(60), nullable=False, default="Incidente")
    periodo = Column(String(40), nullable=False, default="Hoy")
    hora_creacion_ui = Column(String(30), nullable=False)
    hora_actualizacion_ui = Column(String(30), nullable=False)
    estado_ticket = Column(String(40), nullable=False, default="in_progress")
    resumen = Column(Text, nullable=True)

    # Relaciones
    usuario = relationship("Usuario", back_populates="conversaciones")
    mensajes = relationship(
        "Mensaje",
        back_populates="conversacion",
        order_by="Mensaje.id.asc()",
    )


class Mensaje(Base, AuditMixin):
    """
    Entidad de Mensajes individuales dentro de una Conversación (Usuario o Asistente IA).
    ID numérico autoincremental (SERIAL) + 5 campos de auditoría (AuditMixin).
    """

    __tablename__ = "mensajes"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    conversacion_id = Column(
        Integer,
        ForeignKey("conversaciones.id"),
        nullable=False,
        index=True,
    )
    orden_secuencia = Column(Integer, nullable=False, default=1)
    remitente = Column(String(20), nullable=False)  # 'user' | 'assistant'
    hora_ui = Column(String(30), nullable=False)
    contenido = Column(Text, nullable=False)
    status_badge = Column(String(100), nullable=True)
    status_type = Column(String(30), nullable=True)  # 'info' | 'warning' | 'success' | 'critical'
    code_blocks = Column(JSON, nullable=True)
    content_continuation = Column(Text, nullable=True)
    code_blocks_2 = Column(JSON, nullable=True)
    content_continuation_2 = Column(Text, nullable=True)
    footer_note = Column(Text, nullable=True)
    suggested_actions = Column(JSON, nullable=True)

    # Relación con Conversacion
    conversacion = relationship("Conversacion", back_populates="mensajes")


class ReglaConocimiento(Base, AuditMixin):
    """
    Entidad de Base de Conocimiento del Sistema Experto y Población para el Algoritmo Genético.
    ID numérico autoincremental (SERIAL) + 5 campos de auditoría (AuditMixin).
    """

    __tablename__ = "reglas_conocimiento"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    codigo_regla = Column(String(40), unique=True, nullable=False, index=True)
    categoria = Column(String(60), nullable=False, index=True)
    titulo_diagnostico = Column(String(180), nullable=False)
    status_badge = Column(String(100), nullable=False)
    status_type = Column(String(30), nullable=False, default="info")
    palabras_clave = Column(JSON, nullable=False)
    peso_prioridad = Column(Float, nullable=False, default=1.0)
    contenido_principal = Column(Text, nullable=False)
    code_blocks = Column(JSON, nullable=True)
    content_continuation = Column(Text, nullable=True)
    code_blocks_2 = Column(JSON, nullable=True)
    content_continuation_2 = Column(Text, nullable=True)
    footer_note = Column(Text, nullable=True)
    suggested_actions = Column(JSON, nullable=True)


class LogAlgoritmoGenetico(Base, AuditMixin):
    """
    Entidad que registra cada ejecución del Algoritmo Genético (Unidad 3) al evaluar
    y optimizar la selección de respuestas diagnósticas para una consulta técnica.
    ID numérico autoincremental (SERIAL) + 5 campos de auditoría (AuditMixin).
    """

    __tablename__ = "logs_algoritmo_genetico"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    consulta_usuario = Column(Text, nullable=False)
    regla_seleccionada_id = Column(Integer, ForeignKey("reglas_conocimiento.id"), nullable=True)
    tamano_poblacion = Column(Integer, nullable=False)
    generaciones_ejecutadas = Column(Integer, nullable=False)
    tasa_mutacion = Column(Float, nullable=False)
    aptitud_maxima = Column(Float, nullable=False)
    cromosoma_optimo = Column(JSON, nullable=False)
    tiempo_ejecucion_ms = Column(Float, nullable=False)
