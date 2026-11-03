import json
import random
import re
import time
import logging
from typing import List, Dict, Any, Tuple, Optional
import httpx
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.entities import ReglaConocimiento, LogAlgoritmoGenetico

logger = logging.getLogger("techassist.ai_engine")


class Chromosome:
    """
    Representa un Individuo (Cromosoma) dentro de la población del Algoritmo Genético.
    Genes del cromosoma:
      - rule_idx: Índice de la regla candidata en la Base de Conocimiento del Sistema Experto.
      - alpha_exact: Peso evolutivo para coincidencias exactas de términos técnicos.
      - beta_partial: Peso evolutivo para coincidencias parciales / subcadenas.
      - gamma_priority: Factor de ponderación del nivel de criticidad de la regla.
    """

    def __init__(
        self,
        rule_idx: int,
        alpha_exact: float,
        beta_partial: float,
        gamma_priority: float,
    ):
        self.rule_idx = rule_idx
        self.alpha_exact = alpha_exact
        self.beta_partial = beta_partial
        self.gamma_priority = gamma_priority
        self.fitness: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_idx": self.rule_idx,
            "alpha_exact": round(self.alpha_exact, 4),
            "beta_partial": round(self.beta_partial, 4),
            "gamma_priority": round(self.gamma_priority, 4),
            "fitness": round(self.fitness, 4),
        }


class GeneticDiagnosticOptimizer:
    """
    Motor Evolutivo basado en Algoritmos Genéticos (Unidad 3) acoplado al
    Sistema Experto de Soporte Técnico TI (Unidad 2).

    Ciclo Evolutivo:
      1. Inicialización de la población de cromosomas (Población N).
      2. Evaluación de la Función de Aptitud (Fitness Function) frente a los síntomas del usuario.
      3. Selección por Torneo (Tournament Selection) de los individuos más aptos.
      4. Cruza (Crossover) de un punto y recombinación aritmética de pesos.
      5. Mutación estocástica (Mutation) para preservar diversidad genética.
      6. Iteración por G generaciones con elitismo.
    """

    def __init__(
        self,
        rules: List[ReglaConocimiento],
        population_size: int = 24,
        generations: int = 15,
        mutation_rate: float = 0.18,
    ):
        self.rules = rules
        self.population_size = population_size
        self.generations = generations
        self.mutation_rate = mutation_rate

    @staticmethod
    def tokenize(text: str) -> List[str]:
        clean = re.sub(r"[^a-záéíóúñ0-9\._-]", " ", text.lower())
        return [tok for tok in clean.split() if len(tok) >= 2]

    def initialize_population(self) -> List[Chromosome]:
        """Genera la población inicial garantizando cobertura de todas las reglas activas."""
        population: List[Chromosome] = []
        num_rules = len(self.rules)
        for i in range(self.population_size):
            rule_idx = i % num_rules if i < num_rules else random.randint(0, num_rules - 1)
            chrom = Chromosome(
                rule_idx=rule_idx,
                alpha_exact=random.uniform(1.8, 3.2),
                beta_partial=random.uniform(0.8, 1.6),
                gamma_priority=random.uniform(0.9, 1.4),
            )
            population.append(chrom)
        return population

    def calculate_fitness(self, chromosome: Chromosome, query_text: str, query_tokens: List[str]) -> float:
        """
        Función de Aptitud (Fitness):
        Evalúa qué tan óptima es la regla y la configuración de hiperparámetros del cromosoma
        para resolver el incidente descrito por el técnico.
        """
        rule = self.rules[chromosome.rule_idx]
        keywords: List[str] = rule.palabras_clave or []
        lower_query = query_text.lower()

        exact_hits = 0
        partial_hits = 0

        for kw in keywords:
            kw_lower = kw.lower()
            if kw_lower in query_tokens or f" {kw_lower} " in f" {lower_query} ":
                exact_hits += 1
            elif kw_lower in lower_query:
                partial_hits += 1

        # Penalización para evitar que pesos artificialmente altos distorsionen una regla sin coincidencias
        if exact_hits == 0 and partial_hits == 0:
            return 0.05 * rule.peso_prioridad

        raw_score = (
            (exact_hits * chromosome.alpha_exact)
            + (partial_hits * chromosome.beta_partial)
        ) * (rule.peso_prioridad * chromosome.gamma_priority)

        # Normalización suave para premiar proporción de síntomas cubiertos
        coverage_bonus = (exact_hits + 0.5 * partial_hits) / max(len(keywords), 1)
        return round(raw_score + (coverage_bonus * 5.0), 4)

    def tournament_selection(self, population: List[Chromosome], k: int = 3) -> Chromosome:
        """Selección por Torneo: elige k individuos al azar y retorna el de mayor aptitud."""
        contenders = random.sample(population, min(k, len(population)))
        return max(contenders, key=lambda c: c.fitness)

    def crossover(self, parent1: Chromosome, parent2: Chromosome) -> Tuple[Chromosome, Chromosome]:
        """
        Operador de Cruza (Crossover):
        Recombina el gen de regla diagnóstica y promedia ponderadamente los genes continuos.
        """
        eta = random.random()
        child1 = Chromosome(
            rule_idx=parent1.rule_idx if random.random() < 0.5 else parent2.rule_idx,
            alpha_exact=eta * parent1.alpha_exact + (1 - eta) * parent2.alpha_exact,
            beta_partial=eta * parent1.beta_partial + (1 - eta) * parent2.beta_partial,
            gamma_priority=eta * parent1.gamma_priority + (1 - eta) * parent2.gamma_priority,
        )
        child2 = Chromosome(
            rule_idx=parent2.rule_idx if random.random() < 0.5 else parent1.rule_idx,
            alpha_exact=(1 - eta) * parent1.alpha_exact + eta * parent2.alpha_exact,
            beta_partial=(1 - eta) * parent1.beta_partial + eta * parent2.beta_partial,
            gamma_priority=(1 - eta) * parent1.gamma_priority + eta * parent2.gamma_priority,
        )
        return child1, child2

    def mutate(self, chromosome: Chromosome) -> None:
        """
        Operador de Mutación (Mutation):
        Altera aleatoriamente el índice de regla o aplica una perturbación gaussiana a los pesos.
        """
        if random.random() < self.mutation_rate:
            chromosome.rule_idx = random.randint(0, len(self.rules) - 1)
        if random.random() < self.mutation_rate:
            chromosome.alpha_exact = max(1.0, min(3.5, chromosome.alpha_exact + random.gauss(0, 0.2)))
        if random.random() < self.mutation_rate:
            chromosome.beta_partial = max(0.5, min(2.0, chromosome.beta_partial + random.gauss(0, 0.15)))

    def evolve(self, query_text: str) -> Tuple[ReglaConocimiento, Chromosome, float]:
        """
        Ejecuta las iteraciones evolutivas completas y retorna:
        (Mejor Regla del Sistema Experto, Cromosoma Óptimo, Tiempo en ms).
        """
        start_time = time.perf_counter()
        query_tokens = self.tokenize(query_text)
        population = self.initialize_population()

        for _ in range(self.generations):
            # Evaluar aptitud de toda la población actual
            for chrom in population:
                chrom.fitness = self.calculate_fitness(chrom, query_text, query_tokens)

            # Ordenar de mayor a menor aptitud (Elitismo: conservamos los 2 mejores intactos)
            population.sort(key=lambda c: c.fitness, reverse=True)
            next_generation: List[Chromosome] = [
                Chromosome(
                    population[0].rule_idx,
                    population[0].alpha_exact,
                    population[0].beta_partial,
                    population[0].gamma_priority,
                ),
                Chromosome(
                    population[1].rule_idx,
                    population[1].alpha_exact,
                    population[1].beta_partial,
                    population[1].gamma_priority,
                ),
            ]

            # Reproducción (Selección -> Cruza -> Mutación) hasta completar la nueva población
            while len(next_generation) < self.population_size:
                p1 = self.tournament_selection(population)
                p2 = self.tournament_selection(population)
                c1, c2 = self.crossover(p1, p2)
                self.mutate(c1)
                self.mutate(c2)
                next_generation.extend([c1, c2])

            population = next_generation[: self.population_size]

        # Evaluación final de la última generación
        for chrom in population:
            chrom.fitness = self.calculate_fitness(chrom, query_text, query_tokens)
        population.sort(key=lambda c: c.fitness, reverse=True)

        best_chromosome = population[0]
        best_rule = self.rules[best_chromosome.rule_idx]
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return best_rule, best_chromosome, elapsed_ms


async def call_gemini_if_configured(
    user_query: str,
    best_rule: ReglaConocimiento,
) -> Optional[Dict[str, Any]]:
    """
    Si el usuario configuró GEMINI_API_KEY en el archivo .env, combina el resultado
    del Sistema Experto + Algoritmo Genético (RAG Híbrido) con la API de Google Gemini.
    """
    if not settings.GEMINI_API_KEY:
        return None

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY}"
    )
    system_prompt = (
        "Eres TechAssist AI, un Sistema Experto de Soporte Técnico TI Nivel 2/3. "
        "Responde SIEMPRE en JSON válido con las claves exactas: "
        "statusBadge (string), statusType ('info'|'warning'|'success'), "
        "content (string en markdown), codeBlocks (lista de objetos {language, title, code}), "
        "contentContinuation (string opcional), suggestedActions (lista de 3 strings). "
        f"Contexto base seleccionado por el Algoritmo Genético: {best_rule.titulo_diagnostico} - {best_rule.contenido_principal}"
    )

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": f"{system_prompt}\n\nConsulta del técnico: {user_query}"}],
            }
        ],
        "generationConfig": {"responseMimeType": "application/json"},
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(raw_text)
    except Exception as exc:
        logger.warning(f"Fallback a Motor Experto Local tras excepción en Gemini API: {exc}")
    return None


async def diagnose_incident(
    db: Session,
    user_query: str,
    audit_user: str = "c.cabral@techassist.corp",
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Punto de entrada principal del Motor Híbrido de IA:
    1. Recupera las reglas activas (status = 1) desde PostgreSQL.
    2. Ejecuta el Algoritmo Genético Evolutivo para encontrar la regla diagnóstica óptima.
    3. Registra la corrida evolutiva en la tabla 'logs_algoritmo_genetico' con campos de auditoría.
    4. Si hay clave LLM externa configurada, enriquece la respuesta; de lo contrario,
       construye la respuesta técnica estructurada a partir del cromosoma ganador.
    """
    active_rules = (
        db.query(ReglaConocimiento)
        .filter(ReglaConocimiento.status == 1)
        .all()
    )

    optimizer = GeneticDiagnosticOptimizer(
        rules=active_rules,
        population_size=24,
        generations=15,
        mutation_rate=0.18,
    )
    best_rule, best_chrom, elapsed_ms = optimizer.evolve(user_query)

    # Registrar auditoría de la ejecución del Algoritmo Genético en PostgreSQL
    ga_log = LogAlgoritmoGenetico(
        consulta_usuario=user_query,
        regla_seleccionada_id=best_rule.id if best_chrom.fitness >= 1.0 else None,
        tamano_poblacion=optimizer.population_size,
        generaciones_ejecutadas=optimizer.generations,
        tasa_mutacion=optimizer.mutation_rate,
        aptitud_maxima=best_chrom.fitness,
        cromosoma_optimo=best_chrom.to_dict(),
        tiempo_ejecucion_ms=elapsed_ms,
        usuario_crea=audit_user,
        usuario_edita=None,
        status=1,
    )
    db.add(ga_log)
    db.commit()

    engine_mode = "Hybrid-GA-ExpertSystem"
    llm_result = await call_gemini_if_configured(user_query, best_rule)

    if llm_result:
        engine_mode = "Hybrid-GA + Gemini-2.0-Flash"
        response_payload = {
            "category": best_rule.categoria,
            "content": llm_result.get("content", best_rule.contenido_principal),
            "statusBadge": llm_result.get("statusBadge", best_rule.status_badge),
            "statusType": llm_result.get("statusType", best_rule.status_type),
            "codeBlocks": llm_result.get("codeBlocks", best_rule.code_blocks),
            "contentContinuation": llm_result.get("contentContinuation", best_rule.content_continuation),
            "codeBlocks2": best_rule.code_blocks_2,
            "contentContinuation2": best_rule.content_continuation_2,
            "footerNote": (
                f"Optimización Genética: Regla {best_rule.codigo_regla} "
                f"(Fitness: {best_chrom.fitness} | {optimizer.generations} generaciones en {elapsed_ms} ms)."
            ),
            "suggestedActions": llm_result.get("suggestedActions", best_rule.suggested_actions),
        }
    elif best_chrom.fitness >= 1.0:
        # Coincidencia óptima encontrada por el Algoritmo Genético en la Base de Conocimiento
        response_payload = {
            "category": best_rule.categoria,
            "content": best_rule.contenido_principal,
            "statusBadge": f"{best_rule.status_badge} [{best_rule.codigo_regla}]",
            "statusType": best_rule.status_type,
            "codeBlocks": best_rule.code_blocks,
            "contentContinuation": best_rule.content_continuation,
            "codeBlocks2": best_rule.code_blocks_2,
            "contentContinuation2": best_rule.content_continuation_2,
            "footerNote": (
                f"{best_rule.footer_note or ''} | "
                f"Algoritmo Genético: Aptitud={best_chrom.fitness}, Población={optimizer.population_size}, "
                f"Generaciones={optimizer.generations} ({elapsed_ms} ms)."
            ).strip(" |"),
            "suggestedActions": best_rule.suggested_actions,
        }
    else:
        # Consulta general de soporte técnico TI: respuesta diagnóstica de triaje general
        snippet = user_query[:70] + ("..." if len(user_query) > 70 else "")
        response_payload = {
            "category": "Incidente",
            "content": (
                f"### Evaluación Técnica de Incidente L2\n"
                f"He analizado los síntomas reportados en tu solicitud: **\"{snippet}\"**.\n\n"
                f"El Algoritmo Genético evaluó **{optimizer.population_size} individuos** durante "
                f"**{optimizer.generations} generaciones** y sugiere iniciar con una recolección de telemetría "
                f"de eventos críticos del sistema operativo para aislar la causa raíz:"
            ),
            "statusBadge": "Triaje General de Telemetría",
            "statusType": "info",
            "codeBlocks": [
                {
                    "language": "powershell",
                    "title": "Auditoría de eventos críticos recientes (Últimas 24h)",
                    "code": (
                        "Get-WinEvent -FilterHashtable @{LogName='System','Application'; Level=1,2; "
                        "StartTime=(Get-Date).AddDays(-1)} -MaxEvents 15 | "
                        "Select-Object TimeCreated, Id, ProviderName, Message | Format-Table -Wrap"
                    ),
                }
            ],
            "contentContinuation": (
                "Comparte el código de error (`Event ID`) o especifica si la anomalía afecta **Red (DHCP/APIPA/DNS)**, "
                "**Hardware (BSOD/Disco SMART)** o **Identidad (Active Directory/GPO/NTP)** para activar la regla especializada."
            ),
            "codeBlocks2": None,
            "contentContinuation2": None,
            "footerNote": (
                f"Evaluación evolutiva completada en {elapsed_ms} ms "
                f"(Población={optimizer.population_size}, Generaciones={optimizer.generations})."
            ),
            "suggestedActions": [
                "Renovación forzada de DHCP",
                "Análisis de dump BSOD",
                "Auditar puertos con PowerShell",
            ],
        }

    genetic_metrics = {
        "population_size": optimizer.population_size,
        "generations": optimizer.generations,
        "mutation_rate": optimizer.mutation_rate,
        "best_fitness": best_chrom.fitness,
        "selected_rule_code": best_rule.codigo_regla,
        "execution_time_ms": elapsed_ms,
        "engine_mode": engine_mode,
    }

    return response_payload, genetic_metrics

