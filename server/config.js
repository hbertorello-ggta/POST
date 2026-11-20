const bool = (v, d) => (v === undefined || v === '' ? d : ['1', 'true', 'yes'].includes(String(v).toLowerCase()));

export const config = {
  port: Number(process.env.PORT ?? 4000),
  host: process.env.HOST ?? '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL,
  zabbix: {
    url: process.env.ZABBIX_URL,
    token: process.env.ZABBIX_TOKEN,
    validateCerts: bool(process.env.ZABBIX_VALIDATE_CERTS, true),
    timeoutMs: Number(process.env.ZABBIX_TIMEOUT_MS ?? 15000),
  },
};
