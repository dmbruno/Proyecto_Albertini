<div align="center">

# 👨‍🦲 Albertini — Gestión de Pedidos

**Sistema interno de gestión de pedidos a mayoristas para equipos pequeños.**

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Mobile First](https://img.shields.io/badge/Mobile-First-EA580C?style=flat-square&logo=googlechrome&logoColor=white)

</div>

---

## 📋 ¿Qué es?

Albertini reemplaza el flujo manual de planillas Excel para armar pedidos a mayoristas. Permite a un equipo de 3 personas gestionar clientes, productos y pedidos desde cualquier dispositivo — incluyendo celular en campo.

Un solo pedido agrupa **múltiples clientes** con sus respectivos productos. Al finalizar, se exporta un **PDF profesional** listo para enviar al mayorista.

---

## ✨ Funcionalidades

| Módulo | Descripción |
|---|---|
| 🔐 **Login** | Autenticación con email y contraseña vía Supabase Auth. Sin registro público. |
| 👥 **Clientes** | ABM completo. Campos: razón social, CUIT, dirección, entrega, tipo de comprobante. |
| 📦 **Productos** | ABM con filtro activo/inactivo. Precio final, precio sin IVA, unidades por pallet y por caja. |
| 🛒 **Pedidos** | Un pedido por fecha con N clientes. Cada cliente tiene sus propias líneas de producto con subtotales. |
| 📄 **Export PDF** | PDF profesional con secciones por cliente, datos fiscales, tabla de productos y total general. |

---

## 🗂 Estructura del proyecto

```
src/
├── components/
│   ├── atoms/          # Button, Input, Select, Badge, Spinner
│   ├── molecules/      # FormField, SearchBar, ConfirmDialog
│   ├── organisms/      # Header, NavMenu, ClienteForm, ProductoForm, PedidoItemRow
│   ├── templates/      # AppLayout, AuthLayout
│   └── pages/          # Login, Pedidos, NuevoPedido, EditarPedido, DetallePedido, Clientes, Productos
├── context/
│   ├── AuthContext.jsx  # Sesión, login, logout
│   └── ToastContext.jsx # Notificaciones globales
├── hooks/
│   ├── useClientes.js
│   ├── useProductos.js
│   ├── usePedido.js
│   └── usePedidos.js
├── lib/
│   ├── supabaseClient.js
│   └── exportPdf.jsx   # Generador de PDF con @react-pdf/renderer
└── styles/
    └── globals.css     # Design tokens en :root + todos los estilos
```

---

## 🗄 Esquema de base de datos

```sql
clientes       → id, razon_social, cuit, direccion, entrega, tipo_comprobante
productos      → id, nombre, precio_final, precio_sin_iva, un_pallet, un_caja, activo
pedidos        → id, fecha, estado ('borrador' | 'enviado'), usuario_id
pedido_items   → id, pedido_id, cliente_id, producto_id, pallet, cajas, piezas, precio
```

> RLS activo en las 4 tablas. Política: cualquier usuario autenticado puede leer y escribir todo.

---

## 🚀 Setup local

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd ProyectoAlbertini
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

Completar en `.env`:

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

### 3. Base de datos

Ejecutar en el SQL Editor de Supabase:

```sql
-- Clientes
create table clientes (
  id uuid primary key default gen_random_uuid(),
  razon_social text not null,
  cuit text,
  direccion text,
  entrega text,
  tipo_comprobante text,
  created_at timestamptz default now()
);

-- Productos
create table productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  precio_final numeric(12,2),
  precio_sin_iva numeric(12,2),
  un_pallet integer,
  un_caja integer,
  activo boolean default true,
  created_at timestamptz default now()
);

-- Pedidos
create table pedidos (
  id uuid primary key default gen_random_uuid(),
  fecha date default current_date,
  usuario_id uuid references auth.users(id),
  estado text default 'borrador',
  created_at timestamptz default now()
);

-- Items del pedido
create table pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid references pedidos(id) on delete cascade,
  cliente_id uuid references clientes(id),
  producto_id uuid references productos(id),
  pallet integer default 0,
  cajas integer default 0,
  piezas integer default 0,
  precio numeric(12,2)
);

-- RLS
alter table clientes     enable row level security;
alter table productos    enable row level security;
alter table pedidos      enable row level security;
alter table pedido_items enable row level security;

create policy "auth_all" on clientes     for all to authenticated using (true) with check (true);
create policy "auth_all" on productos    for all to authenticated using (true) with check (true);
create policy "auth_all" on pedidos      for all to authenticated using (true) with check (true);
create policy "auth_all" on pedido_items for all to authenticated using (true) with check (true);
```

### 4. Usuarios

Los usuarios se crean **manualmente** desde el Dashboard de Supabase → Authentication → Users. No hay registro público.

### 5. Correr el proyecto

```bash
npm run dev
```

---

## 🛠 Stack

| Tecnología | Versión | Rol |
|---|---|---|
| [React](https://react.dev) | 19 | UI |
| [Vite](https://vitejs.dev) | 8 | Build tool |
| [Supabase](https://supabase.com) | — | Base de datos + Auth |
| [react-router-dom](https://reactrouter.com) | v7 | Routing |
| [@react-pdf/renderer](https://react-pdf.org) | 4 | Generación de PDF |
| CSS custom properties | — | Sistema de diseño (sin librerías UI) |

---

## 📱 Diseño

- **Mobile-first** — pensado para usarse en celular en campo
- **Atomic Design** — átomos → moléculas → organismos → templates → páginas
- **Sin librerías UI externas** — todo CSS propio con tokens en `:root`
- **Paleta**: azul primario `#1a4b8b` · naranja acento `#ea580c`

---

## ⚠️ Notas

- El proyecto de Supabase en **Free Tier se pausa** tras ~1 semana sin tráfico. El primer request lo despierta (puede tardar 1–2 segundos).
- Los 3 usuarios del equipo tienen acceso total a todos los datos (RLS permisivo por diseño).

---

<div align="center">

Hecho con ☕ para el equipo Albertini

</div>
