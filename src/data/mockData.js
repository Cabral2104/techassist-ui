/**
 * mockData.js
 * Datos simulados para TechAssist AI.
 * Incluye conversaciones realistas de soporte técnico de TI (Falla de red con IP APIPA 169.254.x.x),
 * historial agrupado por fechas y datos del perfil del técnico.
 */

export const MOCK_USER = {
  id: "tech-042",
  name: "Carlos Cabral",
  email: "c.cabral@techassist.corp",
  role: "Especialista de Soporte TI (N2)",
  department: "Infraestructura & Operaciones",
  status: "online",
  avatarUrl: null, // null usará las iniciales
  initials: "CC",
  tier: "Nivel 2 - Redes & SysAdmin"
};

export const INITIAL_CONVERSATIONS = [
  {
    id: "chat-network-apipa",
    title: "Falla de red: IP APIPA 169.254.x.x en PC-Ventas-04",
    category: "Redes",
    period: "Hoy",
    createdAt: "10:14 AM",
    updatedAt: "10:28 AM",
    status: "in_progress",
    summary: "Estación de trabajo sin acceso a ERP tras recibir dirección 169.254.88.14 (APIPA).",
    messages: [
      {
        id: "msg-1",
        sender: "user",
        timestamp: "10:15 AM",
        content: "Hola TechAssist. Tengo un equipo crítico en la sucursal de ventas (`PC-VENTAS-04`) que perdió comunicación con la red local y con internet. El usuario no puede entrar al ERP ni mandar trabajos a las impresoras de red. Ya reiniciaron el equipo pero sigue igual."
      },
      {
        id: "msg-2",
        sender: "assistant",
        timestamp: "10:16 AM",
        statusBadge: "Triaje Inicial",
        statusType: "info",
        content: `Entendido, Carlos. Vamos a aislar la falla de forma metodológica para determinar si es un problema de capa física (enlace/cable), capa de red (DHCP/asignación de IP) o servicio local.

Por favor, solicita al usuario o ejecuta vía consola remota el siguiente comando para verificar los adaptadores de red y su concesión actual:`,
        codeBlocks: [
          {
            language: "cmd",
            title: "Verificación de interfaz de red",
            code: "ipconfig /all"
          }
        ],
        footerNote: "Presta especial atención al sufijo DNS específico para la conexión, estado de DHCP habilitado y dirección IPv4."
      },
      {
        id: "msg-3",
        sender: "user",
        timestamp: "10:20 AM",
        content: `Ejecuté el comando en la máquina. La salida indica:
- **Dirección IPv4 de configuración automática**: \`169.254.88.14\`
- **Máscara de subred**: \`255.255.0.0\`
- **Puerta de enlace predeterminada**: *(en blanco)*
- **DHCP habilitado**: Sí

Intenté hacer un ping al gateway habitual (\`192.168.1.1\`) y el resultado es:
\`\`\`
Haciendo ping a 192.168.1.1 con 32 bytes de datos:
Tiempo de espera agotado para esta solicitud.
Tiempo de espera agotado para esta solicitud.
Paquetes: enviados = 4, recibidos = 0, perdidos = 4 (100% perdidos)
\`\`\`
¿Qué me recomiendas hacer ahora?`
      },
      {
        id: "msg-4",
        sender: "assistant",
        timestamp: "10:22 AM",
        statusBadge: "Diagnóstico APIPA Confirmado",
        statusType: "warning",
        content: `### Diagnóstico del Problema:
El equipo tiene asignada una dirección en el rango **169.254.0.0/16 (APIPA - Automatic Private IP Addressing)**. Esto ocurre cuando el cliente DHCP de Windows envía solicitudes \`DHCPDISCOVER\` y no recibe ninguna respuesta (\`DHCPOFFER\`) de ningún servidor DHCP en el segmento.

Al estar en una subred lógica diferente sin Gateway configurado, el ping a \`192.168.1.1\` falla por diseño.

---

### Plan de Acción en 4 Pasos:

#### 1. Forzar Renovación de Arrendamiento DHCP
Ejecuta en una ventana de PowerShell o CMD como Administrador:`,
        codeBlocks: [
          {
            language: "cmd",
            title: "Liberación y renovación de DHCP",
            code: `ipconfig /release
ipconfig /flushdns
ipconfig /renew`
          }
        ],
        contentContinuation: `#### 2. Verificar el Estado del Servicio DHCP Client
Asegúrate de que el servicio de Windows no se haya detenido o bloqueado:`,
        codeBlocks2: [
          {
            language: "powershell",
            title: "Comprobar y reiniciar servicio DHCP",
            code: `Get-Service -Name Dhcp | Select-Object Name, Status, StartType
# Si está detenido o trabado:
Restart-Service -Name Dhcp -Force`
          }
        ],
        contentContinuation2: `#### 3. Validación de Capa Física y Switchport
Si \`ipconfig /renew\` arroja un error de *"No se puede contactar al servidor DHCP"*:
- Revisa los LEDs del puerto RJ-45 en la PC y en la roseta de pared (debe haber enlace ámbar/verde intermitente).
- Si otros equipos en la misma sucursal funcionan, conecta la laptop a otro punto de red para descartar puerto dañado en el Switch de acceso.
- Verifica si la VLAN en el switchport no fue movida accidentalmente o si la tabla ARP del switch tiene conflicto.`,
        suggestedActions: [
          "Ejecutar script de renovación y flush DNS",
          "Probar asignación de IP estática temporal (192.168.1.240)",
          "Revisar logs en el Event Viewer (Microsoft-Windows-DHCP Client)"
        ]
      }
    ]
  },
  {
    id: "chat-bsod-update",
    title: "Reinicio en bucle tras actualización KB5034441",
    category: "Hardware/SO",
    period: "Hoy",
    createdAt: "08:30 AM",
    updatedAt: "09:05 AM",
    status: "resolved",
    summary: "Error 0x80070643 al intentar redimensionar partición WinRE.",
    messages: []
  },
  {
    id: "chat-wireguard-vpn",
    title: "Configuración VPN WireGuard en nodo remoto",
    category: "Redes",
    period: "Semana pasada",
    createdAt: "Lun, 14:10",
    updatedAt: "Lun, 15:45",
    status: "resolved",
    summary: "Generación de llaves públicas/privadas y rutas de subred 10.8.0.0/24.",
    messages: []
  },
  {
    id: "chat-sql-disk-alert",
    title: "Alerta de espacio en disco C: Servidor SQL-PROD",
    category: "Servidores",
    period: "Semana pasada",
    createdAt: "Mar, 11:20",
    updatedAt: "Mar, 12:15",
    status: "resolved",
    summary: "Reducción de logs transaccionales LDF y purga de respaldos obsoletos.",
    messages: []
  },
  {
    id: "chat-ad-credentials",
    title: "Restablecimiento de credenciales Active Directory",
    category: "Identidad",
    period: "Semana pasada",
    createdAt: "Vie, 16:00",
    updatedAt: "Vie, 16:30",
    status: "resolved",
    summary: "Desbloqueo de cuenta Kerberos y sincronización con Azure AD Connect.",
    messages: []
  }
];

export const QUICK_SHORTCUTS = [
  {
    id: "network-diagnosis",
    title: "Diagnóstico de Red",
    description: "IP APIPA (169.254.x.x), DNS no responde, pérdida de paquetes o Gateway inalcanzable.",
    icon: "Network",
    color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400 hover:border-cyan-400/60",
    glowColor: "rgba(6, 182, 212, 0.15)",
    initialPrompt: "Tengo un problema de conectividad de red en un equipo de la oficina. No obtiene dirección IP correcta y no llega al gateway. ¿Cuál es el procedimiento de diagnóstico paso a paso?"
  },
  {
    id: "hardware-troubleshoot",
    title: "Falla de Hardware",
    description: "Pantallas azules (BSOD), memoria RAM con fallos, salud SMART de SSD/HDD o temperatura crítica.",
    icon: "Cpu",
    color: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400 hover:border-amber-400/60",
    glowColor: "rgba(245, 158, 11, 0.15)",
    initialPrompt: "Un equipo presenta reinicios espontáneos con código BSOD CRITICAL_PROCESS_DIED. ¿Cómo puedo extraer y analizar el archivo Memory.dmp con WinDbg o BlueScreenView?"
  },
  {
    id: "software-config",
    title: "Configuración de Software",
    description: "Políticas de grupo (GPO), activación de licencias, servicios de Windows o permisos NTFS corporativos.",
    icon: "Settings",
    color: "from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400 hover:border-purple-400/60",
    glowColor: "rgba(168, 85, 247, 0.15)",
    initialPrompt: "Necesito auditar y forzar la aplicación de directivas de grupo GPO en un equipo cliente unido al dominio que no está recibiendo las actualizaciones de seguridad."
  }
];

export const QUICK_PILLS = [
  "Renovación forzada de DHCP",
  "Análisis de dump BSOD",
  "Auditar puertos con PowerShell",
  "Verificar sincronización NTP",
  "Limpiar caché DNS y Winsock"
];
