-- El tag real de los Access Point en Zabbix es "access point" (con espacio), no "ap".
-- Solo actualiza si la regla sigue siendo la original (no pisa una regla editada por el usuario).
UPDATE device_categories
   SET rules = '[[{"tag":"network"},{"tag":"access point"}]]'::jsonb
 WHERE code = 'ap'
   AND rules = '[[{"tag":"network"},{"tag":"ap"}]]'::jsonb;
