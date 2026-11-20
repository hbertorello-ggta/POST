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
- **Topología de red:** ver la sección "Topología de red — detalle" más abajo.
- Diseño: iconos acordes a cada host, sonidos con botón de silenciar, animaciones, varios temas (claro/oscuro y otros)
  sin tipografías rebuscadas que afecten la lectura de datos.

## Topología de red — detalle

### Qué existe hoy en el código (`src/components/topology/NetworkTopologyView.tsx`, solo datos simulados del sitio Pilar)
Zoom y desplazamiento del lienzo; mover nodos arrastrando; "Auto-organizar" por niveles (core / distribución / acceso);
"Agregar nodo" (modal con lista de dispositivos simulados); "Crear enlace" manual mediante un modal (nodo origen y destino,
puertos, velocidad, VLAN); eliminar enlace; panel lateral inspector de nodo o enlace; "Guardar vista" (solo muestra un aviso,
**no persiste nada**). Los controles de edición solo se ven con el perfil `admin` (selector Soporte/Admin de la barra superior).
**No existe todavía:** nube de Internet y proveedores, modos ojo/engranaje, Guardar/Descartar, conexión arrastrando desde una
flecha, datos reales de Zabbix, persistencia en PostgreSQL, ni armado automático por LLDP.

### Comportamiento deseado
1. **Dos modos.** *Visualizar* (icono ojo, por defecto): al hacer click en un nodo se ven los detalles del dispositivo; no se
   puede modificar nada. *Configurar* (icono engranaje): todo es editable, los cambios quedan en borrador y hay botones
   **Guardar** y **Descartar** (descartar vuelve exactamente al último estado guardado, para deshacer errores sin consecuencias).
2. **Internet.** Una nube que representa Internet; se agregan 1 o 2 proveedores (según el sitio) y se conectan como cualquier nodo.
3. **Nodos.** En configuración se eligen los hosts del sitio que se verán en el diagrama (los demás no se agregan). Hay un
   desplegable de categorías (Todos / Firewall / Switch / Servidores / ...) para no mostrar una lista interminable, con la cantidad
   por categoría (la API ya la devuelve en `summary`). Ejemplo en Casa Central: Firewall = `sitio:CAP` + `network` + `firewall`;
   Switch = `sitio:CAP` + `network` + `switch`; Servidores = `sitio:CAP` + `servidor` (no llevan `network`); Acces Point = `sitio:CAP` + `access point` (no llevan `network`).
4. **Conexiones.** Debajo de cada nodo aparece una flecha: se hace click, se arrastra sin soltar hasta otro nodo, el nodo destino
   se ilumina, y al soltar se crea la conexión. Una conexión se puede eliminar. Esto reemplaza al modal actual de "Crear enlace"
   (el modal puede quedar como opción para elegir puertos).
5. **Item en el enlace.** Al seleccionar una línea se puede asignar, opcionalmente, un item de Zabbix (el tráfico del puerto que
   conecta); si lo tiene, se muestra el tráfico en la línea o en el inspector.
6. **Armado automático por LLDP.** Si los switch o firewall tienen los datos (tags `component: topology`, `edge_target`,
   `edge_target_port`, `puerto` e item `Port {#SNMPINDEX}: Link to {#REMOTE_SYSNAME}`), la topología se propone sola. Si no hay
   datos, queda manual y se guarda. **Riesgo:** en Zabbix muchos equipos se llaman por su IP (ej. `172.16.4.10`) mientras que
   `REMOTE_SYSNAME` es el nombre del equipo, así que hace falta un modo de emparejarlos (por nombre, por IP o una asignación
   manual que se hace una sola vez).
7. **Persistencia.** Nodos, posiciones, proveedores, enlaces e item asignado se guardan en PostgreSQL por sitio
   (propuesta: tablas `topology_nodes` y `topology_links`, con `site_code`, tipo de nodo `host|internet|isp`, `hostid` cuando
   corresponda, posición, puertos e `itemid`).
8. **Estado en vivo.** Nodos y enlaces se colorean según el estado real en Zabbix y se actualizan periódicamente.

### Supuestos por confirmar (corregir si no coinciden)
- La topología es **una por sitio y compartida por todos los usuarios** (refleja la red física). Lo personal es qué sitios ve cada uno.
- Sin login, cualquiera puede entrar al modo configuración; cuando haya SSO/Active Directory se limitará por rol.
  (Hoy depende del selector Soporte/Admin.)
- Los proveedores de Internet se cargan a mano (no son hosts de Zabbix); su enlace puede tener un item opcional (ping o tráfico).
- Varias conexiones entre los mismos dos nodos (troncales, agregaciones): por definir.

## Estado
Hecho (commit `a404b04`): renombrado a POST, backend + PostgreSQL + Zabbix, sitios, categorías, ajustes por host, transiciones.
**Siguiente:** conectar la interfaz a los datos reales — (1) selección de sitios por usuario, (2) vista de un sitio con hosts
reales agrupados por categoría, (3) pantalla de configuración, (4) métricas y gráficos, (5) topología editable.
