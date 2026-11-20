# POST (Portal de Soporte Técnico) — Contexto del proyecto

Léelo completo antes de proponer cambios. Está pensado para retomar el trabajo en una conversación nueva.

## Qué es
Portal de monitoreo de sitios (plantas, molinos, distribuidoras) conectado a Zabbix. Los técnicos eligen qué sitios ven;
corporativo ve todos. Solo se muestran los hosts e items relevantes para producción, y todo debe ser **configurable,
modular y escalable**. "Sitio", "planta" y "ubicación" son lo mismo.

## Entorno
- Desarrollo en Windows 11 (carpeta del repo local con git). Producción: servidor Linux (donde corre Grafana y otro
  proyecto React de monitoreo que usa el mismo patrón: backend Node como proxy de Zabbix). Node en el servidor: v24.18.0.
- `npm run dev:all` levanta web (puerto 3000) + API (puerto 4000). `npm test` corre los tests del clasificador.
- Configuración en `.env` (NO se versiona; plantilla en `.env.example`).
- Zabbix **7.4.14**, host `LUNA.intranet.granjatresarroyos.com.ar`. API de solo lectura, token en header
  `Authorization: Bearer`. Certificado omitido solo en esa conexión (`ZABBIX_VALIDATE_CERTS=false`).
- Base de datos: **PostgreSQL propia, DB `post`**, separada de Zabbix y de Grafana (la DB por defecto de Grafana es
  SQLite: no usarla). Dev: PostgreSQL local; definitivo: instalado en el Linux de Grafana. Conexión por `DATABASE_URL`.
  Migraciones SQL en `server/migrations/`, se aplican solas al arrancar la API.

## Cómo trabajamos
- Claude NO tiene escritura en GitHub: entrega parches (`.patch`) que se aplican con `git apply` (antes `--check`).
  No dejar archivos `.patch` ni `.env` dentro del repo.
- Frontend: React 19 + TypeScript + Vite + Tailwind + framer-motion + Recharts + @xyflow/react. Hoy las pantallas
  aún usan datos simulados (`src/data/mockData.ts`); el backend ya entrega datos reales.

## Datos de Zabbix (observados)
- El sitio de cada host se indica con el tag `sitio: <CODIGO>` (2 a 5 caracteres). Tabla `sites` editable, 23 sitios.
  CER = Molino Super (Planta Super Faena se eliminó).
- Tags por tipo: switch = `network`+`switch`; firewall = `network`+`firewall`; AP = `network`+`access point` (con espacio);
  UPS = `ups` (SIN `network`); servidores = `servidor: windows|vmware|dc`, a veces `esxi` y `aplicacion: sql|veeam|backupexec|digifort|pharaoh`;
  alias `server: proxy`; impresoras = `impresoras: hp|samsung` (tag duplicado, uno con valor vacío).
- LLDP (si existe): tags `component: network`, `component: topology`, `edge_target: {#REMOTE_SYSNAME}`,
  `edge_target_port: {#REMOTE_PORTDESC}`, `puerto: {#SNMPINDEX}`; item `Port {#SNMPINDEX}: Link to {#REMOTE_SYSNAME}`.
  No todos los equipos lo tienen: si no hay dato, la topología se arma a mano y se guarda.
- Hosts deshabilitados (`status 1`) se ocultan por defecto. Hay hosts solo con `sitio` (sin clasificar).
- Conocido: IP 172.16.4.88 aparece en dos hosts (29045 y NESO 29051) en CAP.

## Decisiones tomadas
- **Criticidad se maneja en POST, no en Zabbix** (la API es de solo lectura): `productive` | `support`, más nombre a
  mostrar, categoría manual y ocultar. Se guarda por usuario en `host_config`.
- Sin login por ahora: todo se guarda con usuario `default` (`getUser()` en `server/index.js`). Etapa posterior:
  SSO / usuario+clave contra el Active Directory de Windows.
- Categorías de dispositivo = reglas de tags editables (`device_categories`): lista de reglas (OR), cada regla lista de
  condiciones (AND); gana la de mayor prioridad. Se cargan firewall, ups, switch, ap, esxi, server, printer.
- La API de Zabbix se consulta solo desde el backend (el navegador nunca habla con Zabbix), con caché de 30 s.
- **Diseño: se conserva el estilo actual de la app** (oscuro tipo NOC, tipografías y paneles existentes). Transiciones con
  framer-motion en `src/lib/motion.ts` (zoom desde el click en modales, drawers que deslizan, zoom in/out entre pantallas,
  respeta "reducir movimiento").

## API actual (`server/index.js`)
`GET /api/health` · `GET|POST /api/sites`, `PUT|DELETE /api/sites/:code` · `GET|PUT /api/me/sites` ·
`GET|POST /api/categories`, `PUT|DELETE /api/categories/:code` · `PUT|DELETE /api/hosts/:hostid/config` ·
`GET /api/sites/:code/hosts` (filtros `category`, `tag`, `q`, `include_disabled`, `include_hidden`; devuelve `summary` por categoría).

## Requisitos pendientes (del documento original)
- Elegir qué sitios ve cada usuario; qué hosts y categorías importan (ej.: SQL de producción sí, de desarrollo no).
- Items por tipo, configurables y ampliables: servidor = CPU, memoria, disco (% o MB/GB) + ping; UPS = ping, temperatura,
  entrada/salida, autonomía; impresora = ping (+ items extra como horas); switch = tráfico por puerto; servicios clave.
  Paneles: series de tiempo (rango elegible) para ping/CPU, "stat" para valores puntuales (ej. °C).
- **Topología de red** (vista `eye` por defecto / modo configuración `settings` con Guardar y Descartar): nube "Internet" con
  1 o 2 proveedores por sitio; nodos traídos de Zabbix y elegibles; selector por categoría (Firewall = sitio+network+firewall,
  Switch = sitio+network+switch, Servidores = sitio+servidor); conectar arrastrando desde una flecha bajo el nodo (el destino
  se ilumina), eliminar conexión, asignar a la línea un item de tráfico del puerto; armado automático por LLDP si hay datos.
- Diseño: iconos acordes a cada host, sonidos con botón de silenciar, animaciones, varios temas (claro/oscuro y otros)
  sin tipografías rebuscadas que afecten la lectura de datos.

## Estado
Hecho (commit `a404b04`): renombrado a POST, backend + PostgreSQL + Zabbix, sitios, categorías, ajustes por host, transiciones.
**Siguiente:** conectar la interfaz a los datos reales — (1) selección de sitios por usuario, (2) vista de un sitio con hosts
reales agrupados por categoría, (3) pantalla de configuración, (4) métricas y gráficos, (5) topología editable.
