# Módulo Cuenta Corriente v2 — Plan de Implementación

> Reemplaza el diseño anterior (documentado más abajo en "Anexo: diseño v1, deprecado").
> Cambio de fondo: las cuentas corrientes dejan de nutrirse automáticamente de los
> pedidos enviados. Pasan a ser un registro manual de las facturas reales que factura
> la fábrica (según el peso real pesado en planta) y de los pagos que hace cada cliente.

## Concepto nuevo

El flujo real del negocio:

1. Mi cliente arma el pedido en la app y lo envía a la fábrica (esto no cambia).
2. La fábrica separa las piezas, las pesa, y determina el kilaje y el importe **real**
   de cada producto — que casi nunca coincide con el precio estimado por pieza que
   calcula la app al armar el pedido.
3. La fábrica emite la factura real y se la manda a mi cliente.
4. Mi cliente busca a cada cliente propio en la app y carga manualmante esa factura
   real (o nota de crédito/débito/remito) en su cuenta corriente.
5. Cuando el cliente paga, se carga el pago (con su medio de pago).
6. La app avisa cuando una factura está por vencer o ya venció, para que se pueda
   hacer seguimiento de cobranza.

La cuenta corriente **ya no depende de `pedidos` / `pedido_items`**. Es un libro de
movimientos independiente, cargado 100% a mano.

## Saldo por tipo de comprobante

> Ampliación sobre la primera versión de este plan: agrego acá los tipos que
> habíamos dejado afuera (AJUSTE, DEVOLUCIÓN, INTERÉS, CH-RECH) porque tu propia
> planilla ya los usa activamente, y sin ellos la cuenta corriente no queda
> realmente completa para uso contable. Dejo afuera solo `TEST`, que en tu Excel
> parece una fila de prueba, no un tipo de comprobante real. Si lo necesitás, se
> agrega en dos minutos.

```
saldo = Σ (FAC + ND + INTERES + CH-RECH + AJUSTE-debe)
      − Σ (NC + DEVOLUCION + PAGO + AJUSTE-haber)
```

| Tipo | Efecto en el saldo | Notas |
|---|---|---|
| Factura (FAC) | Debe (+) | Sube la deuda del cliente |
| Nota de Débito (ND) | Debe (+) | Sube la deuda (ajuste a favor de la fábrica) |
| Interés (INTERES) | Debe (+) | Interés por mora / pago fuera de término |
| Cheque rechazado (CH-RECH) | Debe (+) | Revierte un pago con cheque que rebotó — ver sección de cheques |
| Nota de Crédito (NC) | Haber (−) | Baja la deuda, funciona como un pago |
| Devolución (DEVOLUCION) | Haber (−) | Devolución de mercadería, baja la deuda |
| Pago (PAGO) | Haber (−) | Baja la deuda |
| Ajuste (AJUSTE) | Debe o Haber, a elección | Corrección manual de saldo; ver más abajo |
| Remito (REMITO) | Sin efecto (0) | Solo registra la entrega, no impacta el saldo |

Un saldo positivo = el cliente debe. Cero o negativo = al día / a favor (igual que hoy).

**Ajuste con signo elegible**: a diferencia de los demás tipos, un `AJUSTE` no tiene
una dirección obvia (puede ser una corrección a favor o en contra del cliente), así
que al cargarlo el formulario pide explícitamente "¿Suma o resta del saldo?"
(columna `ajuste_efecto`, ver sección 1).

---

## 1. Base de datos (SQL a ejecutar en Supabase)

La tabla `movimientos_cuenta` ya existe y **está vacía** (se truncó como parte de las
pruebas), así que esta migración no necesita mover datos existentes.

```sql
-- 1. Reemplazar el tipo genérico 'cargo'/'pago' por el tipo de comprobante real
alter table movimientos_cuenta drop constraint if exists movimientos_cuenta_tipo_check;
alter table movimientos_cuenta
  alter column tipo type text,
  add constraint movimientos_cuenta_tipo_check
    check (tipo in ('FAC', 'NC', 'ND', 'REMITO', 'AJUSTE', 'DEVOLUCION', 'INTERES', 'CH-RECH', 'PAGO'));

-- 2. Campos de factura/comprobante (FAC, NC, ND, REMITO, AJUSTE, DEVOLUCION, INTERES, CH-RECH)
alter table movimientos_cuenta
  add column numero_comprobante text,
  add column fecha_vencimiento  date,
  add column producto_id        uuid references productos(id),
  add column pagada             boolean not null default false,
  add column ajuste_efecto      text check (ajuste_efecto in ('DEBE', 'HABER'));

-- 3. Campos de pago
alter table movimientos_cuenta
  add column medio_pago         text
    check (medio_pago in ('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'ECHEQ', 'DEPOSITO', 'COMPRA', 'CANCELADO')),
  add column cheque_numero        text,
  add column cheque_banco         text,
  add column cheque_titular       text,   -- solo si el cheque es de un tercero, no del propio cliente
  add column cheque_fecha_emision date,   -- fecha real de firma (puede ser anterior al vencimiento si es diferido)
  add column cheque_vencimiento   date,   -- fecha en que se puede cobrar/depositar
  add column cheque_estado        text
    check (cheque_estado in ('CARTERA', 'DEPOSITADO', 'ACREDITADO', 'RECHAZADO', 'ENDOSADO'))
    default 'CARTERA';

-- 4. Trazabilidad
alter table movimientos_cuenta
  add column usuario_id             uuid references auth.users(id) default auth.uid(),
  add column movimiento_relacionado_id uuid references movimientos_cuenta(id);
  -- ej: un CH-RECH apunta al PAGO cuyo cheque rebotó; una DEVOLUCION puede apuntar a la FAC que la originó

-- 5. Ya no hace falta el vínculo automático con pedidos
alter table movimientos_cuenta drop column if exists pedido_id;

-- 6. Vista de saldo, actualizada con el signo por tipo de comprobante
create or replace view saldos_clientes as
select
  c.id              as cliente_id,
  c.razon_social,
  c.condicion_iva,
  coalesce(sum(case
    when m.tipo in ('FAC','ND','INTERES','CH-RECH') then m.monto
    when m.tipo = 'AJUSTE' and m.ajuste_efecto = 'DEBE' then m.monto
    else 0
  end), 0) as total_cargos,
  coalesce(sum(case
    when m.tipo in ('NC','DEVOLUCION','PAGO') then m.monto
    when m.tipo = 'AJUSTE' and m.ajuste_efecto = 'HABER' then m.monto
    else 0
  end), 0) as total_pagos,
  coalesce(sum(case
    when m.tipo in ('FAC','ND','INTERES','CH-RECH')       then  m.monto
    when m.tipo in ('NC','DEVOLUCION','PAGO')             then -m.monto
    when m.tipo = 'AJUSTE' and m.ajuste_efecto = 'DEBE'   then  m.monto
    when m.tipo = 'AJUSTE' and m.ajuste_efecto = 'HABER'  then -m.monto
    else 0  -- REMITO no afecta el saldo
  end), 0) as saldo
from clientes c
left join movimientos_cuenta m on m.cliente_id = c.id
group by c.id, c.razon_social, c.condicion_iva;
```

`monto_neto` (para el desglose Neto/IVA de clientes RI) se mantiene tal cual está hoy:
sigue siendo opcional, solo aplica a facturas (`tipo = 'FAC'`), y no es obligatorio
cargarlo — si no se completa, `DetalleCuenta` simplemente no muestra el desglose.

---

## 2. Reglas de negocio

- **`numero_comprobante`, `fecha_vencimiento`, `producto_id`** solo tienen sentido
  cuando `tipo` es `FAC`, `NC`, `ND`, `REMITO`, `AJUSTE`, `DEVOLUCION`, `INTERES` o
  `CH-RECH`.
- **`ajuste_efecto`** es obligatorio únicamente cuando `tipo = 'AJUSTE'` (define si
  ese ajuste suma o resta del saldo). Para el resto de los tipos queda `null` — el
  signo ya está fijo según la tabla de arriba.
- **`medio_pago` y los campos de cheque** solo tienen sentido cuando `tipo = 'PAGO'`.
  `cheque_numero`, `cheque_banco` y `cheque_vencimiento` son obligatorios si
  `medio_pago` es `CHEQUE` o `ECHEQ`. `cheque_titular` y `cheque_fecha_emision` son
  opcionales (`cheque_titular` solo aplica si el cheque no es del cliente directo,
  sino de un tercero que se lo entregó).
- **`fecha_vencimiento` por defecto** = `fecha` (fecha de la factura) `+ 15 días`,
  precargada al elegir `tipo = 'FAC'`, pero siempre editable a mano (en tu planilla
  las celdas de VTO se ajustan manualmente caso a caso).
- **`pagada`** es un flag manual, independiente del saldo calculado. Se usa
  únicamente para silenciar la alerta de vencimiento de esa factura puntual — no
  afecta el cálculo de `saldo` (que sigue siendo Σ cargos − Σ pagos real). Es decir:
  una factura puede estar marcada como "pagada" para sacarla de la alerta aunque el
  pago real todavía no se haya cargado como movimiento separado, y viceversa.
- **Sin auto-generación**: no existe más ningún flujo que cree movimientos
  automáticamente a partir de pedidos. Todo se carga a mano desde `DetalleCuenta`.
  La única excepción semi-asistida es el cheque rechazado (ver más abajo).
- **Edición y borrado libres**: como ya no hay riesgo de desincronizar un cargo de
  su pedido de origen (porque ya no hay pedido de origen), se elimina la regla
  actual de "los cargos no se pueden borrar, se anulan con un pago compensatorio".
  Cualquier movimiento (factura o pago) pasa a poder editarse o eliminarse
  directamente. Esto simplifica bastante la UI de `DetalleCuenta`.

## 3. Manejo de cheques (cartera de valores)

Un pago con `medio_pago = 'CHEQUE'` o `'ECHEQ'` no termina en el momento de
cargarlo — tiene un ciclo de vida que hay que poder seguir, tal como lo maneja un
contador:

```
CARTERA ──► DEPOSITADO ──► ACREDITADO   (cobrado con éxito)
   │              │
   └──────────────┴──────────────► RECHAZADO
   │
   └────────────────────────────► ENDOSADO   (se usa para pagarle a un proveedor)
```

- **`cheque_estado`** arranca en `CARTERA` (recién recibido, sin depositar) y se
  actualiza a mano desde `DetalleCuenta` o desde el panel de cartera (sección 4)
  a medida que avanza: `DEPOSITADO` → `ACREDITADO`, o directamente a `RECHAZADO`
  / `ENDOSADO` según corresponda.
- **Cheque rechazado**: cuando se marca un cheque como `RECHAZADO`, la app ofrece
  crear automáticamente (con confirmación, no en silencio) un movimiento nuevo de
  tipo `CH-RECH` por el mismo importe, con `movimiento_relacionado_id` apuntando
  al `PAGO` original — así el saldo vuelve a subir reflejando que ese pago nunca
  se hizo efectivo, sin perder el historial de que hubo un intento de pago con
  ese cheque puntual.
- **Cheque endosado**: si el cheque se usa para pagarle a un proveedor en vez de
  depositarlo, se marca `ENDOSADO`. No cambia el saldo del cliente (el pago ya
  había bajado la deuda al cargarlo) — es solo información de seguimiento de
  para qué se usó el valor.
- **Panel "Cartera de cheques"**: lista todos los `PAGO` con `medio_pago` en
  (`CHEQUE`, `ECHEQ`) y `cheque_estado` en (`CARTERA`, `DEPOSITADO`), ordenados
  por `cheque_vencimiento` ascendente — la vista de "qué valores tengo en mano y
  cuándo se hacen efectivos" que necesita cualquier control de caja. Se resalta
  en naranja si `cheque_vencimiento` ya pasó y el cheque sigue en `CARTERA` sin
  depositar.

## 4. Alertas de vencimiento

Una factura (`tipo = 'FAC'`, `pagada = false`) entra en alerta según su
`fecha_vencimiento`:

- **Vencida** (rojo): `fecha_vencimiento < hoy`
- **Por vencer** (naranja): `fecha_vencimiento` dentro de los próximos 7 días
- Fuera de esa ventana: no se resalta, aparece normal en el listado de movimientos

Dos lugares donde se muestra:

1. **Inline en `DetalleCuenta.jsx`**: la fila de la factura vencida/por vencer se
   resalta con color y un badge, y tiene un botón "Marcar como pagada" que solo
   pone `pagada = true` (no crea un pago).
2. **Panel nuevo en `CuentaCorriente.jsx`** ("Facturas por vencer"): lista, cruzando
   todos los clientes, las facturas vencidas o por vencer, ordenadas por
   `fecha_vencimiento` ascendente, con acceso directo a esa cuenta y el mismo botón
   "Marcar como pagada".

La misma lógica de "vencida / por vencer" aplica al panel de **Cartera de
cheques** (sección 3), pero sobre `cheque_vencimiento` en vez de
`fecha_vencimiento`, y sobre `PAGO`s en `CARTERA`/`DEPOSITADO` en vez de
`FAC`s sin pagar.

---

## 5. Archivos a modificar

### `src/hooks/useCuentaCorriente.js`
- **Eliminar** `crearCargosDesde` por completo (ya no hay generación automática).
- `registrarMovimiento(payload)` — reemplaza a `registrarCargo`/`registrarPago`;
  guarda cualquiera de los 9 tipos con los campos correspondientes.
- `actualizarMovimiento(id, payload)` — nuevo, permite editar un movimiento existente.
- `eliminarMovimiento(id)` — se simplifica: ya no hay excepción para cargos, cualquier
  movimiento se puede borrar.
- `marcarComoPagada(id)` — nuevo, hace `update pagada = true`.
- `actualizarEstadoCheque(id, nuevoEstado)` — nuevo, actualiza `cheque_estado`. Si
  `nuevoEstado === 'RECHAZADO'`, devuelve una bandera para que la pantalla ofrezca
  crear el `CH-RECH` relacionado (con confirmación del usuario, no automático).
- `fetchFacturasPorVencer()` — nuevo, trae de todos los clientes las facturas con
  `tipo = 'FAC'`, `pagada = false`, ordenadas por `fecha_vencimiento`.
- `fetchCarteraCheques()` — nuevo, trae todos los `PAGO` con `medio_pago` en
  (`CHEQUE`, `ECHEQ`) y `cheque_estado` en (`CARTERA`, `DEPOSITADO`), ordenados por
  `cheque_vencimiento`.

### `src/components/organisms/PagoForm.jsx`
Se reemplaza por un formulario único (ver más abajo) que sirve tanto para cargar
un comprobante (FAC/NC/ND/REMITO/AJUSTE/DEVOLUCION/INTERES/CH-RECH) como un pago
(PAGO), con los campos que correspondan según el `tipo` elegido. Alternativa más
simple: dos componentes separados (`FacturaForm.jsx` y `PagoForm.jsx` extendido)
si se prefiere no mezclar la lógica condicional en un solo formulario — a definir
al implementar, ambas opciones son válidas.

Campos:
- **Tipo** (select: Factura / Nota de Crédito / Nota de Débito / Remito / Ajuste /
  Devolución / Interés / Cheque rechazado / Pago)
- Si es FAC/NC/ND/REMITO/DEVOLUCION/INTERES/CH-RECH:
  - Fecha, Número de comprobante, Fecha de vencimiento (precargada a +15 días si
    es FAC), Importe, Producto (select con los productos existentes de la tabla
    `productos`)
- Si es AJUSTE: además de lo anterior, selector "¿Suma o resta del saldo?"
  (`ajuste_efecto`)
- Si es PAGO:
  - Importe, Fecha de pago, Medio de pago (select: Efectivo / Transferencia /
    Cheque / ECheq / Depósito / Compra / Cancelado)
  - Si el medio es Cheque o ECheq: Número de cheque, Banco, Titular (opcional, si
    es de un tercero), Fecha de emisión (opcional), Fecha de vencimiento del cheque

### `src/components/pages/DetalleCuenta.jsx`
- Actualizar el listado de movimientos: badge por tipo (uno por cada uno de los 9
  tipos, con colores distintos) en vez del actual binario Cargo/Pago.
  Mostrar número de comprobante, producto y vencimiento cuando corresponda.
- Reemplazar el flujo "Anular cargo" (que creaba un pago compensatorio) por
  **Editar** y **Eliminar** directos sobre cualquier movimiento.
  Ver [`ConfirmDialog`](src/components/molecules/ConfirmDialog.jsx) para el borrado.
- Resaltar inline las facturas vencidas/por vencer + botón "Marcar como pagada".
- Para pagos con cheque: mostrar el estado actual (`cheque_estado`) y permitir
  avanzarlo (Cartera → Depositado → Acreditado, o Rechazado/Endosado). Al elegir
  "Rechazado", disparar el flujo asistido de creación del `CH-RECH` (con
  confirmación) descripto en la sección 3.

### `src/components/pages/CuentaCorriente.jsx`
- Agregar panel "Facturas por vencer" arriba del listado de clientes.
- Agregar panel "Cartera de cheques" (puede ser una segunda pestaña/acordeón en
  la misma pantalla, o una ruta nueva `/cuentas/cheques` si se prefiere separarlo
  — a definir al implementar).

### `src/components/pages/DetallePedido.jsx`
- **Eliminar** la llamada a `crearCargosDesde` dentro de `handleMarcarEnviado` y los
  toasts asociados ("cargo registrado en cuenta corriente" / error de cargo).
  Marcar un pedido como "enviado" pasa a ser una operación que solo toca `pedidos`,
  sin ningún efecto en `movimientos_cuenta`.

---

## 6. Orden de implementación sugerido

1. SQL de la sección 1 (migración de esquema — tabla vacía, sin riesgo de datos)
2. `useCuentaCorriente.js` — nuevas funciones, eliminar `crearCargosDesde`
3. `DetallePedido.jsx` — sacar la llamada a `crearCargosDesde`
4. Formulario de carga único, con los campos condicionales por tipo (incluyendo
   cheque y ajuste)
5. `DetalleCuenta.jsx` — nuevo listado con badges por tipo, editar/eliminar, alerta
   de vencimiento inline, seguimiento de estado de cheque
6. `CuentaCorriente.jsx` — paneles de facturas por vencer y cartera de cheques

## 7. Casos borde

- **Cheque/ECheq sin número, banco o vencimiento cargado**: validar en el
  formulario, campos obligatorios solo cuando el medio de pago lo requiere.
- **Remito con importe cargado**: se guarda igual (por trazabilidad), pero no suma
  ni resta del saldo.
- **Factura marcada como pagada sin un PAGO real cargado**: es válido — `pagada`
  es solo un flag de seguimiento de alertas, no reemplaza el registro del pago real
  si se quiere que el saldo baje.
- **AJUSTE sin `ajuste_efecto` elegido**: bloquear el guardado — es el único caso
  donde el signo no se puede inferir del tipo.
- **Cheque rechazado que ya se había marcado `ACREDITADO`**: el flujo de "marcar
  como rechazado" debería poder aplicarse igual (a veces el banco acredita y
  después revierte); simplemente crea el `CH-RECH` correspondiente sin importar
  el estado previo.
- **Cheque endosado que después rebota**: igual que cualquier rechazo — se marca
  `RECHAZADO` y se ofrece crear el `CH-RECH`, más allá de que ya no esté en poder
  del cliente original.
- **Clientes con movimientos viejos del modelo v1** (si quedó alguno con
  `tipo = 'cargo'` o `'pago'` antes del truncate): no debería haber, la tabla se
  vació antes de este cambio. Si aparecieran, no matchean el nuevo check
  constraint y habría que migrarlos o borrarlos antes de aplicar la sección 1.

---

## Anexo: diseño v1 (deprecado)

<details>
<summary>Diseño original — cargos generados automáticamente desde pedidos enviados</summary>

Este fue el diseño inicial del módulo, donde cada pedido marcado como "enviado"
generaba automáticamente un cargo en la cuenta corriente del cliente, calculado
sobre el precio estimado por pieza. Se reemplaza por completo por el diseño de
arriba porque el importe real de facturación lo determina la fábrica según el
peso real, no el precio estimado del pedido.

- `crearCargosDesde({ secciones, pedidoId, fechaPedido })` en
  `src/hooks/useCuentaCorriente.js` — generaba un cargo por cada sección/cliente
  de un pedido al marcarlo como enviado, usando `subtotal`/`subtotalNeto`
  calculados sobre `precio` y `precio_sin_iva` de `pedido_items`.
- Se invocaba desde `handleMarcarEnviado` en `DetallePedido.jsx`.
- `tipo` en `movimientos_cuenta` distinguía solo `'cargo'` / `'pago'`.
- Los cargos no se podían eliminar desde la UI (solo "anular" con un pago
  compensatorio) para no perder trazabilidad con el pedido de origen.

</details>
