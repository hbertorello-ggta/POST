# POST — Portal de Soporte Técnico

Portal de monitoreo de sitios (plantas, molinos, distribuidoras) conectado a Zabbix.
Cada usuario configura qué sitios, dispositivos e items ve.

## Requisitos
- Node.js 20+

## Desarrollo
```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

## Estado actual
Etapa 0: interfaz con datos simulados (`src/data/mockData.ts`).

## Hoja de ruta
1. Backend (API propia) + PostgreSQL con la configuración por usuario (`default` por ahora).
2. Integración con Zabbix (API de solo lectura) filtrando por tag `sitio`.
3. Configuración: sitios, categorías/criticidad de hosts e items por tipo de dispositivo.
4. Topología de red editable (vista/configuración, guardado explícito, LLDP automático si existe).
5. Temas, sonidos y animaciones.
6. Autenticación (SSO / Active Directory).
