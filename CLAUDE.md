# ProyectoAlbertini — Contexto para Claude Code (Parte 2)

## Qué es la app

Gestor de pedidos a mayoristas para un equipo de 3 personas (confianza total entre ellos).
El equipo carga clientes, productos con precios, y arma pedidos que luego se exportan
para enviar al mayorista (Excel y/o PDF).

## Modelo de negocio / flujo actual

Hoy trabajan con 3 planillas Excel:
1. **Planilla de clientes** — datos fiscales (razón social, CUIT, dirección, entrega, tipo comprobante)
2. **Planilla de productos** — nombre, precio final, precio sin IVA, unidades por pallet/caja
3. **Planilla de pedido** — cabecera con datos del cliente + tabla de líneas (producto, pallet/cajas/piezas, precio)

La app reemplaza ese copy/paste manual: permite armar el pedido desde la UI y exportarlo
en el mismo formato que el mayorista espera.

## Stack y convenciones

| Tecnología | Decisión |
|---|---|
| Frontend | React + Vite, **JavaScript puro (.jsx)** — NADA de TypeScript |
| Estilos | CSS propio con **design tokens en `:root`** (`src/styles/globals.css`) |
| Componentes | **Atomic Design**: atoms → molecules → organisms → templates → pages |
| Responsive | **Mobile-first, 100% responsive** (se usa en PC y celular) |
| Backend | **Supabase** (Postgres + Auth). Sin backend propio (sin Flask/Express/Node server) |
| Router | react-router-dom v6 |
| DB client | @supabase/supabase-js |

### Estructura de carpetas

```
src/
  components/
    atoms/       # Button, Input, Label, Badge, Spinner, etc.
    molecules/   # FormField, SearchBar, ProductRow, etc.
    organisms/   # Header, Sidebar, PedidoTable, ClienteCard, etc.
    templates/   # layouts de página (con/sin sidebar, con header)
    pages/       # Login, Clientes, Productos, NuevoPedido, DetallePedido
  lib/
    supabaseClient.js   # cliente Supabase — lee VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
  styles/
    globals.css         # reset + tokens en :root + utilidades mínimas
  hooks/               # custom hooks (useClientes, useProductos, usePedido, etc.)
```

## Esquema de base de datos (Supabase/Postgres)

### Tablas

```sql
-- clientes: datos fiscales del comprador
create table clientes (
  id uuid primary key default gen_random_uuid(),
  razon_social text not null,
  cuit text,
  direccion text,
  entrega text,
  tipo_comprobante text,           -- 'FACTURA' | 'REMITO'
  created_at timestamptz default now()
);

-- productos: catálogo con precios y unidades de empaque
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

-- pedidos: cabecera del pedido
create table pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id),
  fecha date default current_date,
  usuario_id uuid references auth.users(id),
  estado text default 'borrador',  -- 'borrador' | 'enviado'
  created_at timestamptz default now()
);

-- pedido_items: líneas del pedido
create table pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid references pedidos(id) on delete cascade,
  producto_id uuid references productos(id),
  pallet integer default 0,
  cajas integer default 0,
  piezas integer default 0,
  precio numeric(12,2)             -- precio congelado al momento del pedido
);
```

### RLS (Row Level Security)

**Decisión**: equipo de 3 usuarios de confianza, todos ven y editan todo.
RLS activo en las 4 tablas, política: cualquier usuario autenticado puede hacer todo.

```sql
alter table clientes      enable row level security;
alter table productos     enable row level security;
alter table pedidos       enable row level security;
alter table pedido_items  enable row level security;

create policy "auth_all_clientes"     on clientes      for all to authenticated using (true) with check (true);
create policy "auth_all_productos"    on productos     for all to authenticated using (true) with check (true);
create policy "auth_all_pedidos"      on pedidos       for all to authenticated using (true) with check (true);
create policy "auth_all_pedido_items" on pedido_items  for all to authenticated using (true) with check (true);
```

## Auth

- 3 usuarios creados **a mano** en Supabase Dashboard → Authentication → Users.
- **Sin registro público** — no hay formulario de sign-up.
- Login con email + password (Supabase Auth nativo).
- `usuario_id` en `pedidos` referencia `auth.users(id)` para saber quién armó cada pedido.

## Variables de entorno

```
VITE_SUPABASE_URL=https://istrpqnrluvpytufxlyj.supabase.co
VITE_SUPABASE_ANON_KEY=<la anon key del dashboard — Settings → API>
```

Copiar `.env.example` → `.env` y completar la anon key.

## Notas Supabase Free Tier

- El proyecto se **pausa automáticamente** tras ~1 semana sin tráfico.
- El primer request lo despierta (puede tardar ~1-2 segundos).
- Si ves errores de conexión luego de inactividad, esperar y reintentar.

---

## Pendiente para Parte 2 (Claude Code en VS Code)

### Funcionalidades a construir

1. **Pantalla de Login** — formulario email/password → `supabase.auth.signInWithPassword()`

2. **ABM de Clientes** — listar, crear, editar, eliminar. Campos: razón social, CUIT,
   dirección, entrega, tipo de comprobante (FACTURA / REMITO).

3. **ABM de Productos** — listar (con filtro activo/inactivo), crear, editar.
   Campos: nombre, precio_final, precio_sin_iva, un_pallet, un_caja, activo.

4. **Armado de Pedido (flujo principal)**:
   - Elegir cliente
   - Agregar líneas: seleccionar producto → autocompletar precio desde `productos` →
     ingresar pallet / cajas / piezas
   - Calcular totales en tiempo real
   - Guardar como borrador o marcar como enviado

5. **Export a Excel** — replicar el layout actual de la planilla:
   - Cabecera con datos fiscales del cliente (razón social, CUIT, dirección,
     entrega, tipo de comprobante)
   - Tabla de productos (columnas: nombre, pallet, cajas, piezas, precio, subtotal)
   - Librería sugerida: `xlsx` (SheetJS)

6. **Export a PDF** (opcional / fase 2) — mismo layout, librería sugerida: `jsPDF` + `html2canvas`
   o renderizar una vista de impresión con `window.print()`.

### Identidad visual

- Los tokens en `:root` de `globals.css` son **placeholders funcionales**.
- En Parte 2 definir la paleta real, tipografía, y diseño de UI componente por componente.
- Mantener mobile-first: la pantalla de pedidos se usa desde el celular en la calle.

### Hooks sugeridos a crear

```
hooks/
  useAuth.js          # sesión actual, login, logout
  useClientes.js      # CRUD clientes
  useProductos.js     # listar productos activos
  usePedido.js        # estado del pedido en curso, agregar/quitar items
```

---

*Scaffold generado en Parte 1 — Junio 2026*
