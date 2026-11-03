import logging
from sqlalchemy.orm import Session
from app.models.entities import Usuario, Conversacion, Mensaje, ReglaConocimiento
from app.core.security import hash_password

logger = logging.getLogger("techassist.seeder")


def seed_initial_data(db: Session) -> None:
    """
    Puebla la base de datos PostgreSQL con los registros iniciales si aún no existen.
    Todas las tablas utilizan ID numérico autoincremental (1, 2, 3, 4...) generado por
    PostgreSQL (SERIAL) y los 5 campos de auditoría obligatorios:
    (usuario_crea, usuario_edita, fecha_creacion, fecha_edicion, status=1).
    """
    audit_creator = "SYSTEM_INSTALLER"

    # 1. Verificar o crear el técnico principal por defecto (recibirá id = 1)
    default_user = db.query(Usuario).filter(Usuario.email == "c.cabral@techassist.corp").first()
    if not default_user:
        default_user = Usuario(
            nombre="Carlos Cabral",
            email="c.cabral@techassist.corp",
            password_hash=hash_password("admin123"),
            rol="Especialista de Soporte TI (N2)",
            departamento="Infraestructura & Operaciones",
            iniciales="CC",
            tier="Nivel 2 - Redes & SysAdmin",
            usuario_crea=audit_creator,
            usuario_edita=None,
            status=1,
        )
        db.add(default_user)
        db.commit()
        db.refresh(default_user)
        logger.info(f"Usuario técnico inicial creado con ID numérico={default_user.id}.")

    # 2. Poblar la Base de Conocimiento (IDs numéricos 1..8)
    existing_rules = db.query(ReglaConocimiento).count()
    if existing_rules == 0:
        knowledge_rules = [
            ReglaConocimiento(
                codigo_regla="NET-APIPA-001",
                categoria="Redes",
                titulo_diagnostico="Diagnóstico de Direccionamiento APIPA (169.254.x.x) y Falla DHCP",
                status_badge="Diagnóstico APIPA & DHCP",
                status_type="warning",
                palabras_clave=[
                    "apipa", "169.254", "dhcp", "ip", "red", "conectividad",
                    "gateway", "ping", "ipconfig", "renew", "release", "sin internet", "erp"
                ],
                peso_prioridad=1.35,
                contenido_principal=(
                    "### Diagnóstico del Incidente de Red (APIPA / DHCP)\n"
                    "Cuando una estación de trabajo se autoconfigura en el segmento **169.254.0.0/16** o no alcanza "
                    "la puerta de enlace predeterminada, significa que el proceso **DORA (Discover, Offer, Request, Acknowledge)** "
                    "del cliente DHCP falló al no recibir oferta del servidor DHCP local o del agente DHCP Relay.\n\n"
                    "#### Paso 1: Liberación de Caché ARP/DNS y Renovación Forzada de Concesión"
                ),
                code_blocks=[
                    {
                        "language": "cmd",
                        "title": "Renovación completa de pila TCP/IP y DHCP (CMD Admin)",
                        "code": (
                            "ipconfig /release\n"
                            "ipconfig /flushdns\n"
                            "arp -d *\n"
                            "ipconfig /renew"
                        ),
                    }
                ],
                content_continuation=(
                    "#### Paso 2: Verificación del Demonio/Servicio Cliente DHCP y Adaptador Física\n"
                    "Comprueba mediante PowerShell que el servicio `Dhcp` esté activo y verifica el estado de enlace (LinkUp) de la NIC:"
                ),
                code_blocks_2=[
                    {
                        "language": "powershell",
                        "title": "Auditar servicio DHCP y estado físico de tarjeta de red",
                        "code": (
                            "Get-Service -Name Dhcp, Dnscache | Select-Object Name, Status, StartType\n"
                            "Get-NetAdapter | Where-Object Status -eq 'Up' | Select-Object Name, InterfaceDescription, LinkSpeed, MacAddress"
                        ),
                    }
                ],
                content_continuation_2=(
                    "Si tras reiniciar el servicio la dirección continúa en `169.254.x.x`, realiza una prueba con IP estática "
                    "temporal para confirmar si el puerto del Switch de acceso está asignado a la VLAN correcta."
                ),
                footer_note="Regla optimizada por el Motor Experto + Algoritmo Genético (Código: NET-APIPA-001).",
                suggested_actions=[
                    "Probar asignación de IP estática temporal (192.168.1.240)",
                    "Revisar logs en el Event Viewer (Microsoft-Windows-DHCP Client)",
                    "Auditar puertos con PowerShell",
                ],
                usuario_crea=audit_creator,
                status=1,
            ),
            ReglaConocimiento(
                codigo_regla="NET-STATIC-002",
                categoria="Redes",
                titulo_diagnostico="Procedimiento de Aislamiento con IP Estática Temporal",
                status_badge="Configuración Manual de IP",
                status_type="info",
                palabras_clave=[
                    "estática", "estatica", "192.168.1.240", "manual", "asignación",
                    "asignacion", "fija", "aislar", "switchport", "vlan", "revertir"
                ],
                peso_prioridad=1.40,
                contenido_principal=(
                    "### Procedimiento para Asignación de IP Estática Temporal\n"
                    "Para aislar si el problema reside exclusivamente en el servidor DHCP / Relay o en la capa de enlace "
                    "(Switch / VLAN), configuraremos temporalmente una dirección IPv4 estática fuera del pool dinámico:"
                ),
                code_blocks=[
                    {
                        "language": "powershell",
                        "title": "Configurar IP estática con PowerShell (Admin)",
                        "code": (
                            'New-NetIPAddress -InterfaceAlias "Ethernet" -IPAddress "192.168.1.240" -PrefixLength 24 -DefaultGateway "192.168.1.1"\n'
                            'Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses ("192.168.1.1", "1.1.1.1")'
                        ),
                    }
                ],
                content_continuation=(
                    "#### Validación de Conectividad y Retorno a DHCP\n"
                    "Ejecuta `Test-NetConnection 192.168.1.1`. Si el ping responde exitosamente, el cableado estructurado "
                    "y el switchport están operativos y la falla reside 100% en el agotamiento de pool o caída del servicio DHCP."
                ),
                code_blocks_2=[
                    {
                        "language": "powershell",
                        "title": "Revertir interfaz a DHCP automático tras la prueba",
                        "code": (
                            'Set-NetIPInterface -InterfaceAlias "Ethernet" -Dhcp Enabled\n'
                            'Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ResetServerAddresses'
                        ),
                    }
                ],
                footer_note="Asegúrate de verificar antes con 'ping 192.168.1.240' que la IP de prueba no esté ocupada.",
                suggested_actions=[
                    "Auditar alcance y reservas en servidor DHCP",
                    "Limpiar caché DNS y Winsock",
                    "Verificar tabla ARP del segmento local",
                ],
                usuario_crea=audit_creator,
                status=1,
            ),
            ReglaConocimiento(
                codigo_regla="NET-DNS-003",
                categoria="Redes",
                titulo_diagnostico="Restablecimiento de Pila Winsock, Caché DNS y Diagnóstico de Latencia",
                status_badge="Reparación DNS & Winsock",
                status_type="info",
                palabras_clave=[
                    "dns", "winsock", "limpiar", "caché", "cache", "latencia",
                    "paquetes", "nslookup", "resolve-dnsname", "catálogo", "reset"
                ],
                peso_prioridad=1.25,
                contenido_principal=(
                    "### Reconstrucción de Catálogo Winsock y Purga de Resolución DNS\n"
                    "Cuando hay conectividad IP hacia el Gateway pero falla la resolución de nombres de dominio corporativos "
                    "o existen sockets colgados en Windows, aplica el siguiente procedimiento de saneamiento:"
                ),
                code_blocks=[
                    {
                        "language": "cmd",
                        "title": "Purga de DNS y reinicio de catálogo Winsock / TCP-IP",
                        "code": (
                            "ipconfig /flushdns\n"
                            "ipconfig /registerdns\n"
                            "netsh winsock reset\n"
                            "netsh int ip reset"
                        ),
                    }
                ],
                content_continuation=(
                    "#### Verificación de Resolución contra Controlador de Dominio\n"
                    "Comprueba que el servidor DNS primario responda consultas tipo `A` y `SRV` sin pérdida:"
                ),
                code_blocks_2=[
                    {
                        "language": "powershell",
                        "title": "Prueba de resolución DNS con PowerShell",
                        "code": "Resolve-DnsName -Name 'dc01.techassist.corp' -Type A | Format-Table -AutoSize",
                    }
                ],
                suggested_actions=[
                    "Verificar sincronización NTP",
                    "Auditar puertos con PowerShell",
                    "Renovación forzada de DHCP",
                ],
                usuario_crea=audit_creator,
                status=1,
            ),
            ReglaConocimiento(
                codigo_regla="HW-BSOD-004",
                categoria="Hardware/SO",
                titulo_diagnostico="Análisis Forense de Volcado de Memoria (BSOD) y Salud de Hardware",
                status_badge="Triaje de Hardware & Kernel",
                status_type="warning",
                palabras_clave=[
                    "bsod", "pantalla azul", "dmp", "minidump", "memory.dmp", "windbg",
                    "critical_process_died", "hardware", "ram", "kernel", "reinicios", "dump"
                ],
                peso_prioridad=1.35,
                contenido_principal=(
                    "### Análisis de Volcado de Memoria (BSOD) y Diagnóstico de Kernel\n"
                    "Para aislar el controlador (`.sys`) o módulo de hardware que provocó la excepción crítica del kernel "
                    "(`CRITICAL_PROCESS_DIED` / `IRQL_NOT_LESS_OR_EQUAL`), primero localizamos los archivos Minidump y "
                    "eventos BugCheck (ID 1001):"
                ),
                code_blocks=[
                    {
                        "language": "powershell",
                        "title": "Extraer últimos volcados .dmp y eventos WER BugCheck",
                        "code": (
                            'Get-ChildItem -Path "C:\\Windows\\Minidump" -Filter "*.dmp" -ErrorAction SilentlyContinue | '
                            "Sort-Object LastWriteTime -Descending | Select-Object -First 5 Name, Length, LastWriteTime\n"
                            "Get-WinEvent -FilterHashtable @{LogName='System'; Id=1001,41} -MaxEvents 5 | "
                            "Select-Object TimeCreated, Id, Message | Format-List"
                        ),
                    }
                ],
                content_continuation=(
                    "#### Inspección con WinDbg e Integridad del Sistema Operativo\n"
                    "Abre el archivo `.dmp` en **WinDbg Preview** y ejecuta `!analyze -v` para identificar `IMAGE_NAME` y "
                    "`FAILURE_BUCKET_ID`. Paralelamente, repara posibles corrupciones en el almacén de componentes:"
                ),
                code_blocks_2=[
                    {
                        "language": "cmd",
                        "title": "Verificación de integridad DISM y SFC",
                        "code": (
                            "DISM.exe /Online /Cleanup-image /Restorehealth\n"
                            "sfc /scannow"
                        ),
                    }
                ],
                footer_note="Si el BugCheck apunta a ntoskrnl.exe con direcciones variables, programa diagnóstico de RAM (mdsched.exe).",
                suggested_actions=[
                    "Comprobar salud SMART de discos SSD/NVMe",
                    "Programar prueba de memoria RAM (mdsched.exe)",
                    "Auditar controladores de terceros no firmados (verifier)",
                ],
                usuario_crea=audit_creator,
                status=1,
            ),
            ReglaConocimiento(
                codigo_regla="HW-DISK-005",
                categoria="Servidores",
                titulo_diagnostico="Auditoría SMART de Almacenamiento y Liberación en Servidores",
                status_badge="Monitoreo de Almacenamiento & SQL",
                status_type="warning",
                palabras_clave=[
                    "disco", "smart", "ssd", "hdd", "espacio", "sql", "ldf",
                    "almacenamiento", "crystaldisk", "partición", "winre", "temperatura"
                ],
                peso_prioridad=1.25,
                contenido_principal=(
                    "### Diagnóstico de Salud Física de Discos (SMART) y Uso de Volúmenes\n"
                    "Para verificar si existen sectores reasignados, desgaste de celdas NVMe/SSD o saturación de particiones "
                    "críticas en el servidor o estación:"
                ),
                code_blocks=[
                    {
                        "language": "powershell",
                        "title": "Consultar telemetría física SMART y contadores de error de disco",
                        "code": (
                            "Get-PhysicalDisk | Select-Object FriendlyName, MediaType, OperationalStatus, HealthStatus, Size\n"
                            "Get-PhysicalDisk | Get-StorageReliabilityCounter | "
                            "Select-Object DeviceId, Temperature, ReadErrorsUncorrected, WriteErrorsUncorrected, Wear"
                        ),
                    }
                ],
                content_continuation=(
                    "#### Identificación de Archivos Pesados / Logs Transaccionales\n"
                    "Para localizar rápidamente los archivos que consumen mayor espacio en el volumen del sistema:"
                ),
                code_blocks_2=[
                    {
                        "language": "powershell",
                        "title": "Listar los 10 archivos más grandes en el volumen C:",
                        "code": (
                            "Get-ChildItem -Path C:\\ -Recurse -File -ErrorAction SilentlyContinue | "
                            "Sort-Object Length -Descending | Select-Object -First 10 FullName, @{N='SizeMB';E={[math]::Round($_.Length/1MB,2)}}"
                        ),
                    }
                ],
                suggested_actions=[
                    "Programar chkdsk /f /r en ventana de mantenimiento",
                    "Purgar logs antiguos de IIS y Windows Temp",
                    "Análisis de dump BSOD",
                ],
                usuario_crea=audit_creator,
                status=1,
            ),
            ReglaConocimiento(
                codigo_regla="SW-GPO-006",
                categoria="Identidad",
                titulo_diagnostico="Auditoría y Aplicación Forzada de Directivas de Grupo (GPO)",
                status_badge="Sincronización GPO & Dominio",
                status_type="info",
                palabras_clave=[
                    "gpo", "directivas", "políticas", "politicas", "grupo", "dominio",
                    "gpupdate", "gpresult", "actualizaciones", "software", "ntfs", "active directory"
                ],
                peso_prioridad=1.30,
                contenido_principal=(
                    "### Diagnóstico y Sincronización de Directivas de Grupo (GPO)\n"
                    "Cuando un equipo cliente unido al dominio Active Directory no aplica las directivas de seguridad o WSUS, "
                    "debemos auditar el Conjunto Resultante de Directivas (RSoP) y forzar la resincronización con el Controlador de Dominio:"
                ),
                code_blocks=[
                    {
                        "language": "cmd",
                        "title": "Forzar actualización de GPO y exportar reporte HTML RSoP",
                        "code": (
                            "gpupdate /force /boot\n"
                            "gpresult /h C:\\Temp\\Reporte_GPO_Equipo.html /f\n"
                            "gpresult /r /scope:computer"
                        ),
                    }
                ],
                content_continuation=(
                    "#### Validación del Canal Seguro con el Controlador de Dominio\n"
                    "Si `gpupdate` falla por pérdida de relación de confianza entre la cuenta de máquina y AD, repárala sin reingresar al dominio:"
                ),
                code_blocks_2=[
                    {
                        "language": "powershell",
                        "title": "Verificar y reparar canal seguro de máquina en Active Directory",
                        "code": "Test-ComputerSecureChannel -Verbose -Repair",
                    }
                ],
                suggested_actions=[
                    "Verificar sincronización NTP",
                    "Limpiar caché DNS y Winsock",
                    "Revisar permisos en SYSVOL del Controlador de Dominio",
                ],
                usuario_crea=audit_creator,
                status=1,
            ),
            ReglaConocimiento(
                codigo_regla="SEC-PORTS-007",
                categoria="Servidores",
                titulo_diagnostico="Auditoría de Puertos en Escucha, Procesos y Reglas de Firewall",
                status_badge="Auditoría de Red & Seguridad",
                status_type="info",
                palabras_clave=[
                    "puertos", "auditar", "firewall", "tcp", "escucha", "listening",
                    "netstat", "procesos", "conexiones", "powershell", "seguridad"
                ],
                peso_prioridad=1.30,
                contenido_principal=(
                    "### Auditoría de Puertos TCP Activos y Correlación de Procesos\n"
                    "Para identificar qué binarios o servicios mantienen sockets abiertos (`Listen` o `Established`) "
                    "y verificar bloqueos de Firewall en el host:"
                ),
                code_blocks=[
                    {
                        "language": "powershell",
                        "title": "Listar puertos en escucha con nombre de proceso y ruta del ejecutable",
                        "code": (
                            "Get-NetTCPConnection -State Listen | "
                            "Select-Object LocalAddress, LocalPort, OwningProcess, "
                            "@{N='ProcessName';E={(Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName}}, "
                            "@{N='Path';E={(Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).Path}} | "
                            "Sort-Object LocalPort | Format-Table -AutoSize"
                        ),
                    }
                ],
                content_continuation=(
                    "#### Prueba de Conectividad de Puerto Remoto (Reemplazo de Telnet)\n"
                    "Verifica si un puerto específico (ej. `443`, `3389`, `5432`) responde a nivel de transporte TCP:"
                ),
                code_blocks_2=[
                    {
                        "language": "powershell",
                        "title": "Probar socket TCP hacia servidor remoto",
                        "code": "Test-NetConnection -ComputerName 192.168.1.10 -Port 443 -InformationLevel Detailed",
                    }
                ],
                suggested_actions=[
                    "Exportar reglas activas de Windows Defender Firewall",
                    "Limpiar caché DNS y Winsock",
                    "Verificar sincronización NTP",
                ],
                usuario_crea=audit_creator,
                status=1,
            ),
            ReglaConocimiento(
                codigo_regla="SYS-NTP-008",
                categoria="Servidores",
                titulo_diagnostico="Diagnóstico y Resincronización de Tiempo NTP / Kerberos (w32tm)",
                status_badge="Sincronización Horaria NTP",
                status_type="info",
                palabras_clave=[
                    "ntp", "sincronización", "sincronizacion", "reloj", "hora", "tiempo",
                    "w32tm", "kerberos", "desfase", "time"
                ],
                peso_prioridad=1.30,
                contenido_principal=(
                    "### Sincronización del Servicio de Hora de Windows (W32Time / NTP)\n"
                    "Un desfase horario mayor a **5 minutos** entre el cliente y el Controlador de Dominio invalida los tickets "
                    "de autenticación **Kerberos**. Ejecuta los siguientes comandos para auditar y forzar la sincronización NTP:"
                ),
                code_blocks=[
                    {
                        "language": "cmd",
                        "title": "Auditar origen NTP y forzar resincronización inmediata",
                        "code": (
                            "w32tm /query /status /verbose\n"
                            "w32tm /query /source\n"
                            "net stop w32time && net start w32time\n"
                            "w32tm /resync /rediscover"
                        ),
                    }
                ],
                content_continuation=(
                    "Si el equipo pertenece a un dominio Active Directory, debe sincronizar por jerarquía (`NT5DS`). "
                    "Si es un servidor aislado o el PDC Emulator, apunta a un pool NTP confiable:"
                ),
                code_blocks_2=[
                    {
                        "language": "cmd",
                        "title": "Restablecer sincronización por jerarquía de dominio AD",
                        "code": "w32tm /config /syncfromflags:domhier /update\nw32tm /resync /nowait",
                    }
                ],
                suggested_actions=[
                    "Auditar y forzar directivas GPO",
                    "Purgar tickets Kerberos en memoria (klist purge)",
                    "Renovación forzada de DHCP",
                ],
                usuario_crea=audit_creator,
                status=1,
            ),
        ]
        db.add_all(knowledge_rules)
        db.commit()
        logger.info("Base de Conocimiento inicial insertada con IDs numéricos autoincrementales.")

    # 3. Poblar Conversaciones e Historial Inicial (IDs numéricos 1..5)
    existing_convs = db.query(Conversacion).count()
    if existing_convs == 0:
        conv_apipa = Conversacion(
            usuario_id=default_user.id,
            titulo="Falla de red: IP APIPA 169.254.x.x en PC-Ventas-04",
            categoria="Redes",
            periodo="Hoy",
            hora_creacion_ui="10:14 AM",
            hora_actualizacion_ui="10:28 AM",
            estado_ticket="in_progress",
            resumen="Estación de trabajo sin acceso a ERP tras recibir dirección 169.254.88.14 (APIPA).",
            usuario_crea="c.cabral@techassist.corp",
            status=1,
        )
        db.add(conv_apipa)
        db.flush()

        initial_messages = [
            Mensaje(
                conversacion_id=conv_apipa.id,
                orden_secuencia=1,
                remitente="user",
                hora_ui="10:15 AM",
                contenido=(
                    "Hola TechAssist. Tengo un equipo crítico en la sucursal de ventas (`PC-VENTAS-04`) que perdió "
                    "comunicación con la red local y con internet. El usuario no puede entrar al ERP ni mandar trabajos "
                    "a las impresoras de red. Ya reiniciaron el equipo pero sigue igual."
                ),
                usuario_crea="c.cabral@techassist.corp",
                status=1,
            ),
            Mensaje(
                conversacion_id=conv_apipa.id,
                orden_secuencia=2,
                remitente="assistant",
                hora_ui="10:16 AM",
                status_badge="Triaje Inicial",
                status_type="info",
                contenido=(
                    "Entendido, Carlos. Vamos a aislar la falla de forma metodológica para determinar si es un problema "
                    "de capa física (enlace/cable), capa de red (DHCP/asignación de IP) o servicio local.\n\n"
                    "Por favor, solicita al usuario o ejecuta vía consola remota el siguiente comando para verificar los "
                    "adaptadores de red y su concesión actual:"
                ),
                code_blocks=[
                    {
                        "language": "cmd",
                        "title": "Verificación de interfaz de red",
                        "code": "ipconfig /all",
                    }
                ],
                footer_note="Presta especial atención al sufijo DNS específico para la conexión, estado de DHCP habilitado y dirección IPv4.",
                usuario_crea=audit_creator,
                status=1,
            ),
            Mensaje(
                conversacion_id=conv_apipa.id,
                orden_secuencia=3,
                remitente="user",
                hora_ui="10:20 AM",
                contenido=(
                    "Ejecuté el comando en la máquina. La salida indica:\n"
                    "- **Dirección IPv4 de configuración automática**: `169.254.88.14`\n"
                    "- **Máscara de subred**: `255.255.0.0`\n"
                    "- **Puerta de enlace predeterminada**: *(en blanco)*\n"
                    "- **DHCP habilitado**: Sí\n\n"
                    "Intenté hacer un ping al gateway habitual (`192.168.1.1`) y el resultado es:\n"
                    "```\n"
                    "Haciendo ping a 192.168.1.1 con 32 bytes de datos:\n"
                    "Tiempo de espera agotado para esta solicitud.\n"
                    "Paquetes: enviados = 4, recibidos = 0, perdidos = 4 (100% perdidos)\n"
                    "```\n"
                    "¿Qué me recomiendas hacer ahora?"
                ),
                usuario_crea="c.cabral@techassist.corp",
                status=1,
            ),
            Mensaje(
                conversacion_id=conv_apipa.id,
                orden_secuencia=4,
                remitente="assistant",
                hora_ui="10:22 AM",
                status_badge="Diagnóstico APIPA Confirmado",
                status_type="warning",
                contenido=(
                    "### Diagnóstico del Problema:\n"
                    "El equipo tiene asignada una dirección en el rango **169.254.0.0/16 (APIPA - Automatic Private IP Addressing)**. "
                    "Esto ocurre cuando el cliente DHCP de Windows envía solicitudes `DHCPDISCOVER` y no recibe ninguna respuesta "
                    "(`DHCPOFFER`) de ningún servidor DHCP en el segmento.\n\n"
                    "Al estar en una subred lógica diferente sin Gateway configurado, el ping a `192.168.1.1` falla por diseño.\n\n"
                    "---\n\n"
                    "### Plan de Acción en 4 Pasos:\n\n"
                    "#### 1. Forzar Renovación de Arrendamiento DHCP\n"
                    "Ejecuta en una ventana de PowerShell o CMD como Administrador:"
                ),
                code_blocks=[
                    {
                        "language": "cmd",
                        "title": "Liberación y renovación de DHCP",
                        "code": "ipconfig /release\nipconfig /flushdns\nipconfig /renew",
                    }
                ],
                content_continuation=(
                    "#### 2. Verificar el Estado del Servicio DHCP Client\n"
                    "Asegúrate de que el servicio de Windows no se haya detenido o bloqueado:"
                ),
                code_blocks_2=[
                    {
                        "language": "powershell",
                        "title": "Comprobar y reiniciar servicio DHCP",
                        "code": (
                            "Get-Service -Name Dhcp | Select-Object Name, Status, StartType\n"
                            "# Si está detenido o trabado:\n"
                            "Restart-Service -Name Dhcp -Force"
                        ),
                    }
                ],
                content_continuation_2=(
                    "#### 3. Validación de Capa Física y Switchport\n"
                    "Si `ipconfig /renew` arroja un error de *\"No se puede contactar al servidor DHCP\"*:\n"
                    "- Revisa los LEDs del puerto RJ-45 en la PC y en la roseta de pared (debe haber enlace ámbar/verde intermitente).\n"
                    "- Si otros equipos en la misma sucursal funcionan, conecta la laptop a otro punto de red para descartar puerto dañado en el Switch de acceso.\n"
                    "- Verifica si la VLAN en el switchport no fue movida accidentalmente o si la tabla ARP del switch tiene conflicto."
                ),
                suggested_actions=[
                    "Ejecutar script de renovación y flush DNS",
                    "Probar asignación de IP estática temporal (192.168.1.240)",
                    "Revisar logs en el Event Viewer (Microsoft-Windows-DHCP Client)",
                ],
                usuario_crea=audit_creator,
                status=1,
            ),
        ]
        db.add_all(initial_messages)

        other_convs = [
            Conversacion(
                usuario_id=default_user.id,
                titulo="Reinicio en bucle tras actualización KB5034441",
                categoria="Hardware/SO",
                periodo="Hoy",
                hora_creacion_ui="08:30 AM",
                hora_actualizacion_ui="09:05 AM",
                estado_ticket="resolved",
                resumen="Error 0x80070643 al intentar redimensionar partición WinRE.",
                usuario_crea="c.cabral@techassist.corp",
                status=1,
            ),
            Conversacion(
                usuario_id=default_user.id,
                titulo="Configuración VPN WireGuard en nodo remoto",
                categoria="Redes",
                periodo="Semana pasada",
                hora_creacion_ui="Lun, 14:10",
                hora_actualizacion_ui="Lun, 15:45",
                estado_ticket="resolved",
                resumen="Generación de llaves públicas/privadas y rutas de subred 10.8.0.0/24.",
                usuario_crea="c.cabral@techassist.corp",
                status=1,
            ),
            Conversacion(
                usuario_id=default_user.id,
                titulo="Alerta de espacio en disco C: Servidor SQL-PROD",
                categoria="Servidores",
                periodo="Semana pasada",
                hora_creacion_ui="Mar, 11:20",
                hora_actualizacion_ui="Mar, 12:15",
                estado_ticket="resolved",
                resumen="Reducción de logs transaccionales LDF y purga de respaldos obsoletos.",
                usuario_crea="c.cabral@techassist.corp",
                status=1,
            ),
            Conversacion(
                usuario_id=default_user.id,
                titulo="Restablecimiento de credenciales Active Directory",
                categoria="Identidad",
                periodo="Semana pasada",
                hora_creacion_ui="Vie, 16:00",
                hora_actualizacion_ui="Vie, 16:30",
                estado_ticket="resolved",
                resumen="Desbloqueo de cuenta Kerberos y sincronización con Azure AD Connect.",
                usuario_crea="c.cabral@techassist.corp",
                status=1,
            ),
        ]
        db.add_all(other_convs)
        db.commit()
        logger.info("Conversaciones y mensajes iniciales creados con IDs numéricos autoincrementales.")
