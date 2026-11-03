from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.models.base import utc_now
from app.models.entities import Usuario
from app.schemas.schemas import (
    LoginRequest,
    RegisterRequest,
    UserResponse,
    AuditMetadataSchema,
)

router = APIRouter(prefix="/api/auth", tags=["Autenticación & Técnicos"])


def serialize_user(user: Usuario) -> UserResponse:
    return UserResponse(
        id=user.id,
        name=user.nombre,
        email=user.email,
        role=user.rol,
        department=user.departamento,
        status="online" if user.status == 1 else "offline",
        avatarUrl=None,
        initials=user.iniciales,
        tier=user.tier,
        audit=AuditMetadataSchema(
            usuario_crea=user.usuario_crea,
            usuario_edita=user.usuario_edita,
            fecha_creacion=user.fecha_creacion,
            fecha_edicion=user.fecha_edicion,
            status=user.status,
        ),
    )


@router.get("/users", response_model=List[UserResponse])
def list_active_users(db: Session = Depends(get_db)):
    """Lista todos los técnicos activos (status = 1) ordenados por su ID numérico."""
    users = (
        db.query(Usuario)
        .filter(Usuario.status == 1)
        .order_by(Usuario.id.asc())
        .all()
    )
    return [serialize_user(u) for u in users]


@router.post("/login", response_model=UserResponse)
def login_technician(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Autentica a un técnico de soporte TI validando su correo, contraseña y estado activo (status = 1).
    Actualiza los campos de auditoría (usuario_edita, fecha_edicion) al registrar el acceso.
    """
    user = (
        db.query(Usuario)
        .filter(Usuario.email == payload.email.strip().lower(), Usuario.status == 1)
        .first()
    )
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas o cuenta de técnico dada de baja lógica (status=0).",
        )

    user.usuario_edita = user.email
    user.fecha_edicion = utc_now()
    db.commit()
    db.refresh(user)

    return serialize_user(user)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_technician(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Registra un nuevo técnico en PostgreSQL con ID numérico autoincremental (1, 2, 3...)
    y sus 5 campos de auditoría obligatorios (status = 1).
    """
    clean_email = payload.email.strip().lower()
    existing = db.query(Usuario).filter(Usuario.email == clean_email).first()
    if existing:
        if existing.status == 0:
            # Si existía pero tenía borrado lógico, lo reactivamos preservando su ID histórico
            existing.nombre = payload.name.strip()
            existing.password_hash = hash_password(payload.password)
            existing.status = 1
            existing.usuario_edita = clean_email
            existing.fecha_edicion = utc_now()
            db.commit()
            db.refresh(existing)
            return serialize_user(existing)

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un técnico activo registrado con ese correo corporativo.",
        )

    initials = (
        "".join([part[0] for part in payload.name.strip().split() if part])[:2].upper()
        or "TI"
    )
    new_user = Usuario(
        nombre=payload.name.strip(),
        email=clean_email,
        password_hash=hash_password(payload.password),
        rol=payload.role or "Especialista de Soporte TI (N2)",
        departamento=payload.department or "Infraestructura & Operaciones",
        iniciales=initials,
        tier="Nivel 2 - Redes & SysAdmin",
        usuario_crea=clean_email,
        usuario_edita=None,
        status=1,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return serialize_user(new_user)


@router.delete("/users/{user_id}")
def soft_delete_user(
    user_id: int,
    audit_user: Optional[str] = Query(default="c.cabral@techassist.corp"),
    db: Session = Depends(get_db),
):
    """
    Borrado Lógico (Soft Delete) de un técnico: cambia status = 0 sin eliminar el registro de PostgreSQL.
    """
    user = db.query(Usuario).filter(Usuario.id == user_id, Usuario.status == 1).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado o ya inactivo.")

    now = utc_now()
    user.status = 0
    user.usuario_edita = audit_user
    user.fecha_edicion = now
    db.commit()

    return {
        "detail": "Usuario desactivado mediante borrado lógico (status = 0).",
        "user_id": user_id,
        "audit": {
            "usuario_edita": audit_user,
            "fecha_edicion": now.isoformat(),
            "status": 0,
        },
    }
