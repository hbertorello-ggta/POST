-- Sitios (plantas / ubicaciones). El codigo es el valor del tag "sitio" en Zabbix.
CREATE TABLE sites (
  code        text PRIMARY KEY CHECK (code ~ '^[A-Z0-9]{2,5}$'),
  name        text NOT NULL,
  location    text,
  active      boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Sitios que cada usuario eligio monitorear (user_id = 'default' hasta tener login).
CREATE TABLE user_sites (
  user_id    text NOT NULL,
  site_code  text NOT NULL REFERENCES sites(code) ON DELETE CASCADE ON UPDATE CASCADE,
  position   integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, site_code)
);

-- Preferencias libres por usuario (tema, sonido, vistas, etc.).
CREATE TABLE user_settings (
  user_id     text NOT NULL,
  key         text NOT NULL,
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);
