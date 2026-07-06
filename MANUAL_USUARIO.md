<div align="center">

# 📘 Manual de Usuario — Albertini

**Sistema de gestión de pedidos, precios y cuenta corriente**

![Versión](https://img.shields.io/badge/Versión-1.0-1a4b8b?style=flat-square)
![Estado](https://img.shields.io/badge/Estado-Producción-16a34a?style=flat-square)
![Plataforma](https://img.shields.io/badge/Plataforma-Web%20%7C%20Mobile-ea580c?style=flat-square)
![Backend](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Uso](https://img.shields.io/badge/Uso-Interno%20%2F%20Equipo-64748b?style=flat-square)

</div>

---

## 📑 Índice

1. [¿Qué es esta aplicación?](#-qué-es-esta-aplicación)
2. [Ingresar al sistema](#-ingresar-al-sistema)
3. [Módulo: Pedidos](#-módulo-pedidos)
4. [Módulo: Clientes](#-módulo-clientes)
5. [Módulo: Lista de Precios](#-módulo-lista-de-precios)
6. [Módulo: Cuenta Corriente](#-módulo-cuenta-corriente)
7. [Módulo: Estadísticas](#-módulo-estadísticas)
8. [Panel de Administración](#-panel-de-administración)
9. [Preguntas frecuentes](#-preguntas-frecuentes)
10. [⚠️ Aviso importante: base de datos en plan gratuito](#️-aviso-importante-base-de-datos-en-plan-gratuito-de-supabase)
11. [Soporte](#-soporte)

---

## 📋 ¿Qué es esta aplicación?

Albertini es el sistema interno que reemplaza las planillas de Excel que antes se usaban para armar pedidos a mayoristas. Permite al equipo:

- Cargar y mantener actualizados los **clientes** y sus datos fiscales.
- Mantener la **lista de precios** de productos, con zonas de entrega, comisiones y gastos de flete.
- Armar **pedidos** para múltiples clientes en un solo lugar y exportarlos en el formato que espera la fábrica.
- Llevar la **cuenta corriente** de cada cliente: facturas, pagos, cheques, notas de crédito/débito y alertas de vencimiento.
- Ver un **panel de estadísticas** con la evolución de ventas en kilos.

Funciona desde cualquier navegador, en computadora o celular — está pensada para usarse también desde la calle al armar un pedido.

---

## 🔐 Ingresar al sistema

1. Abrir la URL de la aplicación en el navegador.
2. Ingresar el **correo electrónico** y la **contraseña** de tu usuario.
3. Hacer clic en **Ingresar**.

> No existe registro público. Los usuarios los crea un administrador desde el [Panel de Administración](#-panel-de-administración).

Si olvidaste tu contraseña, pedile a un compañero con acceso al Panel de Administración que te la restablezca.

---

## 🛒 Módulo: Pedidos

Es la pantalla principal del sistema. Un **pedido** agrupa a **varios clientes**, cada uno con sus propias líneas de productos.

### Crear un pedido nuevo
1. Ir a **Pedidos** → **+ Nuevo pedido**.
2. Elegir la fecha del pedido.
3. Agregar clientes al pedido y, para cada uno, las líneas de producto: elegir el producto (autocompleta el precio de la lista vigente), y cargar **pallets**, **cajas** y/o **piezas**.
4. El sistema calcula en tiempo real el precio y los **kilos estimados** de cada línea (a razón de ~4 kg por pieza), ya que la fábrica factura por peso real, no por precio unitario.
5. Guardar como **Borrador** para seguir editando después, o continuar hasta marcarlo como **Enviado**.

### Detalle y edición
- Desde el listado de pedidos se puede abrir cualquier pedido para ver el detalle, agrupado visualmente **por zona** (la barra azul indica cada zona de entrega).
- Un pedido en estado **Borrador** se puede editar libremente. Al marcarlo como **Enviado**, se considera cerrado.
- Se puede corregir manualmente la **zona** de un cliente en un pedido puntual con el botón "Corregir zona del cliente", por si la lista de precios cambió después de cargado el pedido.

### Exportar
- **Descargar PDF**: genera el documento "Pedido a fábrica", agrupado por zona, con los datos fiscales de cada cliente y el detalle de productos, precios y kilos estimados — listo para enviar al mayorista.
- **Exportar a Excel**: réplica del formato de planilla que se usaba antes.

---

## 👥 Módulo: Clientes

ABM completo de clientes. Por cada cliente se cargan:

| Campo | Descripción |
|---|---|
| Razón social | Nombre o razón social del cliente |
| CUIT | Número de CUIT |
| Dirección | Dirección de entrega |
| Entrega | Zona/modalidad de entrega |
| Tipo de comprobante | Factura o Remito |
| Condición IVA | Responsable Inscripto, Monotributista, Consumidor Final, Exento |

Desde esta pantalla se pueden **crear**, **editar** y **eliminar** clientes, y buscarlos por nombre.

---

## 💲 Módulo: Lista de Precios

Acá se administra el catálogo de productos y sus precios por zona.

- Cada **zona** (Jujuy, Salta con/sin redespacho, San Pedro, etc.) tiene su propia lista, con **gastos de flete**, **impuesto municipal** (si aplica) y **% de comisión** configurables — el precio final de cada producto se calcula automáticamente a partir de estos valores.
- Se pueden dar de alta productos nuevos, editarlos, y activar/desactivar los que no se venden más (sin necesidad de borrarlos).
- **Descargar PDF**: al exportar la lista de precios de una zona, se puede elegir qué productos incluir y **qué fecha figura en el documento** — esto permite generar hoy una lista con la fecha de una actualización anterior, para cuando se negocia con el comprador un precio que no es el vigente al día de hoy.

---

## 💰 Módulo: Cuenta Corriente

Lleva el registro financiero de cada cliente, de forma completamente independiente de los pedidos (los movimientos se cargan a mano, no se generan solos al armar un pedido).

### Tipos de movimiento
Factura (FAC), Nota de Crédito (NC), Nota de Débito (ND), Remito, Ajuste, Devolución, Interés, Cheque rechazado y Pago.

### Funcionalidades principales
- **Listado de cuentas**: saldo actual de cada cliente, con filtro por "con deuda" / "al día".
- **Detalle de cuenta por cliente**: historial completo de movimientos, con filtro por rango de fechas y por Debe/Haber.
- **Cartera de cheques**: seguimiento del estado de cada cheque recibido (En cartera → Depositado → Acreditado / Rechazado / Endosado), incluyendo a quién se endosó un cheque y cuándo.
- **Alertas de vencimiento**: las facturas próximas a vencer o vencidas se marcan automáticamente. Sobre cada alerta hay dos acciones:
  - **Registrar pago**: carga el pago real y salda la factura.
  - **Apagar alerta**: oculta el aviso sin registrar ningún movimiento (para usar solo si ya se cobró por otro medio).
- **Facturas con foto**: se puede cargar la categoría del producto facturado (Mantequera / Cerutti) y subir una imagen o PDF de la factura, disponible después con el botón "Ver factura".
- **Libro de movimientos global**: todos los movimientos de todos los clientes en un solo lugar, con filtros por fecha, tipo y medio de pago.
- **Descargar PDF (estado de cuenta)**: exporta el historial de movimientos de un cliente en el mismo formato de planilla que se usaba antes (Fecha / Comprobante / Vto. / Número / Producto / Debe / Haber / Saldo), respetando el saldo acumulado real aunque se filtre por un rango de fechas.

---

## 📊 Módulo: Estadísticas

Panel con la evolución de ventas, medida en **kilos** (no en pesos, ya que el negocio se maneja por peso real facturado):

- KPI de kilos totales vendidos en el período.
- Gráficos de evolución por fecha.
- Filtros por rango de fechas (7, 30, 90 días o personalizado).

---

## 🛠 Panel de Administración

Permite gestionar los usuarios que tienen acceso al sistema:

- Crear nuevos usuarios (correo y contraseña).
- Ver la fecha del último ingreso de cada usuario.
- Restablecer contraseñas o dar de baja accesos.

> Solo debería ser usado por quienes administran el equipo — el acceso está disponible para cualquier usuario logueado, ya que el sistema fue diseñado para un equipo pequeño de confianza total (ver nota de RLS más abajo).

---

## ❓ Preguntas frecuentes

**La app tarda unos segundos en cargar la primera vez que la abro en el día.**
Es normal — ver la sección de [aviso sobre el plan gratuito](#️-aviso-importante-base-de-datos-en-plan-gratuito-de-supabase) más abajo.

**¿Puedo ver los pedidos que cargó otro compañero?**
Sí. El sistema está diseñado para que los 3 usuarios del equipo vean y editen toda la información (clientes, pedidos, cuentas corrientes) sin restricciones entre sí.

**Cargué un movimiento de cuenta corriente por error, ¿lo puedo borrar?**
Sí, desde el detalle de cuenta del cliente correspondiente, con el ícono de eliminar en cada movimiento.

**¿Los precios de los pedidos ya armados cambian si actualizo la lista de precios?**
No. El precio de cada línea de un pedido queda "congelado" en el momento en que se cargó, aunque después se actualice la lista de precios.

---

## ⚠️ Aviso importante: base de datos en plan gratuito de Supabase

Este sistema usa **[Supabase](https://supabase.com)** como base de datos y backend (autenticación, almacenamiento de archivos e imágenes de facturas). Actualmente el proyecto está corriendo en el **plan gratuito (Free Tier)** de Supabase.

### Qué incluye el plan gratuito (a la fecha de este documento)

| Recurso | Límite aproximado |
|---|---|
| Espacio en base de datos | 500 MB |
| Almacenamiento de archivos (imágenes de facturas) | 1 GB |
| Transferencia de datos mensual | 5 GB |
| Usuarios autenticados activos por mes | 50.000 |
| Pausa por inactividad | El proyecto se pausa automáticamente tras ~1 semana sin uso. El primer ingreso después de una pausa puede tardar unos segundos en "despertar" la base de datos. |

> 📌 Estos valores son referenciales y **pueden cambiar** — Supabase actualiza periódicamente su política de precios. Antes de tomar cualquier decisión, conviene verificar los valores vigentes en **[supabase.com/pricing](https://supabase.com/pricing)**.

### Qué pasa si se supera algún límite

A medida que se sigan cargando clientes, pedidos, movimientos de cuenta corriente e imágenes de facturas, el uso de la base de datos y del almacenamiento va a ir creciendo. Si en algún momento se supera el límite del plan gratuito:

- Algunos recursos (como el almacenamiento de archivos) pueden bloquear la carga de nuevos datos hasta liberar espacio o actualizar el plan.
- Supabase va a notificar por correo electrónico a la cuenta del proyecto cuando el uso se acerque a los límites.
- La alternativa es pasar al **plan Pro** de Supabase (de pago, con tarifa mensual + consumo adicional según uso), que **no está incluido dentro del costo del desarrollo de esta aplicación** — es un servicio de infraestructura independiente, facturado directamente por Supabase a quien administre la cuenta.

### Recomendación

- Revisar periódicamente el uso actual desde el **Dashboard de Supabase → Settings → Usage**.
- Si el negocio crece (más clientes, más movimientos, más fotos de facturas cargadas), es esperable que en algún momento haga falta actualizar de plan — es una señal de que el sistema se está usando, no un problema del desarrollo.
- Evaluar el upgrade a tiempo evita quedarse sin poder cargar datos en un momento crítico (por ejemplo, en medio de un cierre de pedidos).

---

## 📞 Soporte

Ante cualquier duda de uso o inconveniente técnico, contactar a quien desarrolló y mantiene el sistema.

<div align="center">

*Manual de usuario — Albertini, Gestión de Pedidos*

</div>
