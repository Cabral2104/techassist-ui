from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ============================================================================
# ESQUEMA BASE DE AUDITORÍA (Presente en todas las entidades)
# ============================================================================
class AuditMetadataSchema(BaseModel):
    usuario_crea: str
    usuario_edita: Optional[str] = None
    fecha_creacion: Optional[datetime] = None
    fecha_edicion: Optional[datetime] = None
    status: int = Field(default=1, description="1 = Activo, 0 = Inactivo/Eliminado (Soft Delete)")

    class Config:
        from_attributes = True


# ============================================================================
# ESQUEMAS DE AUTENTICACIÓN Y USUARIOS (ID Numérico Autoincremental)
# ============================================================================
class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "Especialista de Soporte TI (N2)"
    department: Optional[str] = "Infraestructura & Operaciones"


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: str
    status: str = "online"
    avatarUrl: Optional[str] = None
    initials: str
    tier: str
    audit: AuditMetadataSchema


# ============================================================================
# ESQUEMAS DE BLOQUES DE CÓDIGO Y MENSAJES (ID Numérico Autoincremental)
# ============================================================================
class CodeBlockSchema(BaseModel):
    language: str = "powershell"
    title: Optional[str] = None
    code: str


class MessageResponse(BaseModel):
    id: int
    sender: str
    timestamp: str
    content: str
    statusBadge: Optional[str] = None
    statusType: Optional[str] = None
    codeBlocks: Optional[List[CodeBlockSchema]] = None
    contentContinuation: Optional[str] = None
    codeBlocks2: Optional[List[CodeBlockSchema]] = None
    contentContinuation2: Optional[str] = None
    footerNote: Optional[str] = None
    suggestedActions: Optional[List[str]] = None
    audit: Optional[AuditMetadataSchema] = None


# ============================================================================
# ESQUEMAS DE CONVERSACIONES (ID Numérico Autoincremental)
# ============================================================================
class ConversationResponse(BaseModel):
    id: int
    title: str
    category: str
    period: str
    createdAt: str
    updatedAt: str
    status: str  # Estado de UI ('in_progress' | 'resolved')
    summary: Optional[str] = None
    messages: List[MessageResponse] = []
    audit: AuditMetadataSchema


# ============================================================================
# ESQUEMAS DE INTERACCIÓN CON EL MOTOR DE IA Y ALGORITMO GENÉTICO
# ============================================================================
class AttachmentPayload(BaseModel):
    name: str
    size: str
    type: Optional[str] = "text/plain"


class UserMessageInput(BaseModel):
    text: str
    attachment: Optional[AttachmentPayload] = None


class ChatInteractionRequest(BaseModel):
    conversation_id: Optional[int] = None
    user_id: Optional[int] = 1
    user_email: Optional[str] = "c.cabral@techassist.corp"
    message: UserMessageInput


class GeneticMetricsSchema(BaseModel):
    population_size: int
    generations: int
    mutation_rate: float
    best_fitness: float
    selected_rule_code: str
    execution_time_ms: float
    engine_mode: str


class ChatInteractionResponse(BaseModel):
    conversation_id: int
    conversation_title: str
    category: str
    user_message: MessageResponse
    assistant_message: MessageResponse
    genetic_metrics: Optional[GeneticMetricsSchema] = None
