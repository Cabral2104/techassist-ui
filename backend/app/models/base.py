from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, SmallInteger
from sqlalchemy.sql import func


def utc_now():
    return datetime.now(timezone.utc)


class AuditMixin:
    """
    Mixin transversal de Auditoría Empresarial.
    Inyecta de forma obligatoria los 5 campos de control y trazabilidad en cada entidad:
      - usuario_crea: Identificador o correo del creador del registro.
      - usuario_edita: Identificador o correo del último usuario que modificó el registro.
      - fecha_creacion: Marca de tiempo exacta de creación del registro.
      - fecha_edicion: Marca de tiempo exacta de la última modificación.
      - status: Estado lógico numérico (1 = Activo, 0 = Inactivo / Eliminado lógico).
    """

    usuario_crea = Column(
        String(100),
        nullable=False,
        default="SYSTEM",
        comment="Usuario o proceso que creó el registro",
    )
    usuario_edita = Column(
        String(100),
        nullable=True,
        default=None,
        comment="Último usuario que modificó el registro",
    )
    fecha_creacion = Column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=func.now(),
        comment="Fecha y hora de creación del registro",
    )
    fecha_edicion = Column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
        onupdate=utc_now,
        comment="Fecha y hora de última edición del registro",
    )
    status = Column(
        SmallInteger,
        nullable=False,
        default=1,
        index=True,
        comment="Estado del registro: 1 = Activo, 0 = Inactivo (Borrado Lógico)",
    )

