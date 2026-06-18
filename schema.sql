-- ============================================================
-- ProyectoAlbertini — Schema inicial
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- TABLAS
create table clientes (
  id uuid primary key default gen_random_uuid(),
  razon_social text not null,
  cuit text,
  direccion text,
  entrega text,
  tipo_comprobante text,           -- 'FACTURA' | 'REMITO'
  created_at timestamptz default now()
);

create table productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  precio_final numeric(12,2),
  precio_sin_iva numeric(12,2),
  un_pallet integer,               -- unidades por pallet
  un_caja integer,                 -- unidades por caja
  activo boolean default true,
  created_at timestamptz default now()
);

create table pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id),
  fecha date default current_date,
  usuario_id uuid references auth.users(id),
  estado text default 'borrador',  -- 'borrador' | 'enviado'
  created_at timestamptz default now()
);

create table pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid references pedidos(id) on delete cascade,
  producto_id uuid references productos(id),
  pallet integer default 0,
  cajas integer default 0,
  piezas integer default 0,
  precio numeric(12,2)             -- precio congelado al momento del pedido
);

-- RLS: equipo de confianza, cualquier usuario autenticado puede todo
alter table clientes      enable row level security;
alter table productos     enable row level security;
alter table pedidos       enable row level security;
alter table pedido_items  enable row level security;

create policy "auth_all_clientes"     on clientes      for all to authenticated using (true) with check (true);
create policy "auth_all_productos"    on productos     for all to authenticated using (true) with check (true);
create policy "auth_all_pedidos"      on pedidos       for all to authenticated using (true) with check (true);
create policy "auth_all_pedido_items" on pedido_items  for all to authenticated using (true) with check (true);

-- Verificación: correr esto al final para confirmar que RLS quedó activo
-- Debería mostrar las 4 tablas con rowsecurity = true
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('clientes', 'productos', 'pedidos', 'pedido_items');
