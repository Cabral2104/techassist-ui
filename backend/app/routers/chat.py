from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.base import utc_now
from app.models.entities import (
    Conversacion,
    Mensaje,
    ReglaConocimiento,
    LogAlgoritmoGenetico,
    Usuario,
)
from app.routers.conversations import serialize_message
from app.schemas.schemas import (
    ChatInteractionRequest,
    ChatInteractionResponse,
    GeneticMetricsSchema,
)
from app.services.ai_engine import diagnose_incident

router = APIRouter(prefix="/api/chat", tags=["Motor Híbrido IA & Algoritmo Genético"])


def current_ui_time() -> str:
    return datetime.now().strftime("%I:%M %p")


@router.post("", response_model=ChatInteractionResponse)
async def process_chat_message(
    payload: ChatInteractionRequest,
    db: Session = Depends(get_db),
):
    """
    Procesa un mensaje enviado por el técnico:
    1. Si no existe conversación activa, crea una nueva en PostgreSQL con ID numérico autoincremental.
    2. Registra el mensaje del usuario en la tabla 'mensajes' con ID numérico autoincremental y auditoría.
    3. Ejecuta el Motor Híbrido (Sistema Experto + Algoritmo Genético + LLM opcional).
    4. Persiste la respuesta del asistente y los logs evolutivos con auditoría completa.
    """
    audit_user = payload.user_email or "c.cabral@techassist.corp"
    ui_time = current_ui_time()

    user_id = payload.user_id or 1
    user_exists = db.query(Usuario).filter(Usuario.id == user_id, Usuario.status == 1).first()
    if not user_exists:
        fallback_user = db.query(Usuario).filter(Usuario.status == 1).first()
        user_id = fallback_user.id if fallback_user else 1

    raw_text = payload.message.text.strip()
    ai_reply, ga_metrics = await diagnose_incident(
        db=db,
        user_query=raw_text,
        audit_user=audit_user,
    )

    conv = None
    if payload.conversation_id is not None:
        conv = (
            db.query(Conversacion)
            .filter(Conversacion.id == payload.conversation_id, Conversacion.status == 1)
            .first()
        )

    if not conv:
        short_title = (
            raw_text[:42] + "..." if len(raw_text) > 45 else (raw_text or "Nueva Consulta Técnica")
        )
        conv = Conversacion(
            usuario_id=user_id,
            titulo=short_title,
            categoria=ai_reply.get("category", "Incidente"),
            periodo="Hoy",
            hora_creacion_ui=ui_time,
            hora_actualizacion_ui=ui_time,
            estado_ticket="in_progress",
            resumen=raw_text[:160],
            usuario_crea=audit_user,
            usuario_edita=None,
            status=1,
        )
        db.add(conv)
        db.flush()  # Genera el ID numérico autoincremental (1, 2, 3...) en PostgreSQL
    else:
        conv.hora_actualizacion_ui = ui_time
        conv.usuario_edita = audit_user
        conv.fecha_edicion = utc_now()

    existing_count = (
        db.query(Mensaje)
        .filter(Mensaje.conversacion_id == conv.id)
        .count()
    )

    user_content = raw_text
    if payload.message.attachment:
        att = payload.message.attachment
        user_content += f"\n\n*[Archivo adjunto: {att.name} ({att.size})]*"

    user_msg = Mensaje(
        conversacion_id=conv.id,
        orden_secuencia=existing_count + 1,
        remitente="user",
        hora_ui=ui_time,
        contenido=user_content,
        usuario_crea=audit_user,
        usuario_edita=None,
        status=1,
    )
    db.add(user_msg)

    assistant_msg = Mensaje(
        conversacion_id=conv.id,
        orden_secuencia=existing_count + 2,
        remitente="assistant",
        hora_ui=current_ui_time(),
        contenido=ai_reply["content"],
        status_badge=ai_reply.get("statusBadge"),
        status_type=ai_reply.get("statusType", "info"),
        code_blocks=ai_reply.get("codeBlocks"),
        content_continuation=ai_reply.get("contentContinuation"),
        code_blocks_2=ai_reply.get("codeBlocks2"),
        content_continuation_2=ai_reply.get("contentContinuation2"),
        footer_note=ai_reply.get("footerNote"),
        suggested_actions=ai_reply.get("suggestedActions"),
        usuario_crea="TECHASSIST_AI_ENGINE",
        usuario_edita=None,
        status=1,
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(conv)
    db.refresh(user_msg)
    db.refresh(assistant_msg)

    return ChatInteractionResponse(
        conversation_id=conv.id,
        conversation_title=conv.titulo,
        category=conv.categoria,
        user_message=serialize_message(user_msg),
        assistant_message=serialize_message(assistant_msg),
        genetic_metrics=GeneticMetricsSchema(**ga_metrics),
    )


@router.get("/genetic-logs")
def get_genetic_algorithm_logs(db: Session = Depends(get_db)):
    """
    Devuelve las ejecuciones activas (status = 1) del Algoritmo Genético registradas en PostgreSQL.
    """
    logs = (
        db.query(LogAlgoritmoGenetico)
        .filter(LogAlgoritmoGenetico.status == 1)
        .order_by(LogAlgoritmoGenetico.id.desc())
        .limit(25)
        .all()
    )
    return [
        {
            "id": item.id,
            "consulta_usuario": item.consulta_usuario,
            "regla_seleccionada_id": item.regla_seleccionada_id,
            "tamano_poblacion": item.tamano_poblacion,
            "generaciones_ejecutadas": item.generaciones_ejecutadas,
            "tasa_mutacion": item.tasa_mutacion,
            "aptitud_maxima": item.aptitud_maxima,
            "cromosoma_optimo": item.cromosoma_optimo,
            "tiempo_ejecucion_ms": item.tiempo_ejecucion_ms,
            "audit": {
                "usuario_crea": item.usuario_crea,
                "usuario_edita": item.usuario_edita,
                "fecha_creacion": item.fecha_creacion,
                "fecha_edicion": item.fecha_edicion,
                "status": item.status,
            },
        }
        for item in logs
    ]


@router.get("/knowledge-rules")
def get_knowledge_base_rules(db: Session = Depends(get_db)):
    """
    Devuelve las reglas activas (status = 1) de la Base de Conocimiento del Sistema Experto.
    """
    rules = (
        db.query(ReglaConocimiento)
        .filter(ReglaConocimiento.status == 1)
        .order_by(ReglaConocimiento.id.asc())
        .all()
    )
    return [
        {
            "id": r.id,
            "codigo_regla": r.codigo_regla,
            "categoria": r.categoria,
            "titulo_diagnostico": r.titulo_diagnostico,
            "palabras_clave": r.palabras_clave,
            "peso_prioridad": r.peso_prioridad,
            "audit": {
                "usuario_crea": r.usuario_crea,
                "usuario_edita": r.usuario_edita,
                "fecha_creacion": r.fecha_creacion,
                "fecha_edicion": r.fecha_edicion,
                "status": r.status,
            },
        }
        for r in rules
    ]


@router.delete("/knowledge-rules/{rule_id}")
def soft_delete_knowledge_rule(
    rule_id: int,
    audit_user: Optional[str] = Query(default="c.cabral@techassist.corp"),
    db: Session = Depends(get_db),
):
    """
    Borrado Lógico (Soft Delete) de una regla de conocimiento cambiando status = 0.
    """
    rule = (
        db.query(ReglaConocimiento)
        .filter(ReglaConocimiento.id == rule_id, ReglaConocimiento.status == 1)
        .first()
    )
    if not rule:
        raise HTTPException(status_code=404, detail="Regla no encontrada o ya inactiva.")

    now = utc_now()
    rule.status = 0
    rule.usuario_edita = audit_user
    rule.fecha_edicion = now
    db.commit()
    return {"detail": "Regla desactivada mediante borrado lógico (status = 0).", "rule_id": rule_id}
