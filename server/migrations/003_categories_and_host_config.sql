-- Categorias de dispositivo, definidas por reglas de tags de Zabbix.
-- rules = lista de reglas (OR); cada regla es una lista de condiciones (AND):
--   [[{"tag":"network"},{"tag":"switch"}], [{"tag":"servidor","value":"vmware"}]]
-- Sin "value" = el tag existe. Si un host cumple varias categorias gana la de mayor priority.
CREATE TABLE device_categories (
  code        text PRIMARY KEY CHECK (code ~ '^[a-z0-9_]{2,30}$'),
  label       text NOT NULL,
  icon        text NOT NULL DEFAULT 'server',
  priority    integer NOT NULL DEFAULT 0,
  rules       jsonb NOT NULL DEFAULT '[]',
  active      boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0
);

-- Ajustes por host y por usuario (user_id = 'default' hasta tener login).
-- category_code NULL = usar la que resulte de las reglas.
CREATE TABLE host_config (
  user_id       text NOT NULL,
  hostid        text NOT NULL,
  display_name  text,
  category_code text REFERENCES device_categories(code) ON DELETE SET NULL ON UPDATE CASCADE,
  criticality   text CHECK (criticality IN ('productive','support')),
  hidden        boolean NOT NULL DEFAULT false,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, hostid)
);

INSERT INTO device_categories (code,label,icon,priority,sort_order,rules) VALUES
 ('firewall','Firewall','shield',90,10,'[[{"tag":"network"},{"tag":"firewall"}]]'),
 ('ups','UPS','battery-charging',85,20,'[[{"tag":"ups"}]]'),
 ('switch','Switch','network',80,30,'[[{"tag":"network"},{"tag":"switch"}]]'),
 ('ap','Access Point','wifi',70,40,'[[{"tag":"network"},{"tag":"ap"}]]'),
 ('esxi','Host ESXi','server-cog',55,50,'[[{"tag":"esxi"}]]'),
 ('server','Servidor','server',50,60,'[[{"tag":"servidor"}],[{"tag":"server"}]]'),
 ('printer','Impresora','printer',40,70,'[[{"tag":"impresoras"}]]');
