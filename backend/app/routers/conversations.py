from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.base import utc_now
from app.models.entities import Conversacion, Mensaje
from app.schemas.schemas import (
    ConversationResponse,
    MessageResponse,
    AuditMetadataSchema,
)

router = APIRouter(prefix="/api/conversations", tags=["Conversaciones & Historial"])


def serialize_message(msg: Mensaje) -> MessageResponse:
    return MessageResponse(
        id=msg.id,
        sender=msg.remitente,
        timestamp=msg.hora_ui,
        content=msg.contenido,
        statusBadge=msg.status_badge,
        statusType=msg.status_type,
        codeBlocks=msg.code_blocks,
        contentContinuation=msg.content_continuation,
        codeBlocks2=msg.code_blocks_2,
        contentContinuation2=msg.content_continuation_2,
        footerNote=msg.footer_note,
        suggestedActions=msg.suggested_actions,
        audit=AuditMetadataSchema(
            usuario_crea=msg.usuario_crea,
            usuario_edita=msg.usuario_edita,
            fecha_creacion=msg.fecha_creacion,
            fecha_edicion=msg.fecha_edicion,
            status=msg.status,
        ),
    )


def serialize_conversation(conv: Conversacion) -> ConversationResponse:
    active_messages = [m for m in conv.mensajes if m.status == 1]
    return ConversationResponse(
        id=conv.id,
        title=conv.titulo,
        category=conv.categoria,
        period=conv.periodo,
        createdAt=conv.hora_creacion_ui,
        updatedAt=conv.hora_actualizacion_ui,
        status=conv.estado_ticket,
        summary=conv.resumen,
        messages=[serialize_message(m) for m in active_messages],
        audit=AuditMetadataSchema(
            usuario_crea=conv.usuario_crea,
            usuario_edita=conv.usuario_edita,
            fecha_creacion=conv.fecha_creacion,
            fecha_edicion=conv.fecha_edicion,
            status=conv.status,
        ),
    )


@router.get("", response_model=List[ConversationResponse])
def list_active_conversations(db: Session = Depends(get_db)):
    """
    Obtiene todas las conversaciones activas (status = 1) junto con sus mensajes activos
    y metadatos de auditoría desde PostgreSQL.
    """
    conversations = (
        db.query(Conversacion)
        .filter(Conversacion.status == 1)
        .order_by(Conversacion.id.asc())
        .all()
    )
    return [serialize_conversation(c) for c in conversations]


@router.delete("/{conversation_id}")
def soft_delete_conversation(
    conversation_id: int,
    user_email: Optional[str] = Query(default="c.cabral@techassist.corp"),
    db: Session = Depends(get_db),
):
    """
    Realiza un Borrado Lógico (Soft Delete) cambiando status = 0 y registrando
    usuario_edita y fecha_edicion tanto en la conversación como en sus mensajes asociados.
    Nunca se elimina físicamente ningún registro de la base de datos.
    """
    conv = (
        db.query(Conversacion)
        .filter(Conversacion.id == conversation_id, Conversacion.status == 1)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada o ya inactiva.")

    now = utc_now()
    conv.status = 0
    conv.usuario_edita = user_email
    conv.fecha_edicion = now

    for msg in conv.mensajes:
        if msg.status == 1:
            msg.status = 0
            msg.usuario_edita = user_email
            msg.fecha_edicion = now

    db.commit()
    return {
        "detail": "Conversación desactivada mediante borrado lógico (status = 0).",
        "conversation_id": conversation_id,
        "audit": {
            "usuario_edita": user_email,
            "fecha_edicion": now.isoformat(),
            "status": 0,
        },
    }
