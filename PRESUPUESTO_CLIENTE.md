# Presupuesto — Sistema de gestión de pedidos y cuenta corriente

## Contexto (para tenerlo claro antes de hablar)

Esto arrancó como "reemplazar 3 planillas de Excel" — cargar clientes, productos
y armar pedidos para exportar. Eso ya era un trabajo real. Pero en el camino
creció a un sistema bastante más completo:

- Login y manejo de usuarios
- ABM de clientes y productos
- Armado de pedidos con cálculo en tiempo real (pasado de precio a Kg estimado
  para que coincida con cómo factura la fábrica)
- Exportación a Excel y PDF (pedido, pedido a fábrica, cuentas)
- Dashboard de estadísticas con gráficos
- **Un módulo de cuenta corriente completo**: 9 tipos de movimiento, cartera de
  cheques con estados (en cartera, depositado, acreditado, rechazado, endosado),
  alertas de vencimiento de facturas, registro de pagos, carga de imagen de
  factura con almacenamiento en la nube — esto solo, es un sistema de
  facturación/cobranza en sí mismo.

Nada de esto es un reproche a que haya crecido — es lo normal cuando un
proyecto se usa de verdad y aparecen necesidades reales. Pero el volumen de
trabajo ya no es el de "algo sencillo", y vale la pena que quede claro antes
de seguir sumando cosas.

## Cálculo de horas

| | Horas |
|---|---|
| Estimación de horas de mercado (un freelancer construyendo esto de cero, sin IA) | ~160 hs |
| Horas reales de trabajo (usando IA como asistente, ~2x más rápido) | **~80 hs** |

## Tarifa

**80 horas × USD 20/hora = USD 1.600**

Esto ya es la versión "con descuento de amigo": si esto se lo cotizara a un
cliente nuevo por fuera, con tarifa de mercado y sin el ahorro de tiempo que
da trabajar con IA, el número real ronda los **USD 3.000–3.500**. No hace
falta decir esto último con esas palabras exactas, pero sirve para que vos
tengas el ancla en la cabeza: no estás inflando nada, estás cobrando la mitad
de lo que vale.

## Cómo plantearlo (sugerencia de mensaje)

La idea es mostrar primero el número de mercado como ancla ("mirá cuánto
sale esto realmente"), y después contrastarlo con lo que le vas a cobrar a
él — así el precio de amigo se ve como lo que es: un privilegio real, no un
número arbitrario. No suena defensivo ni oportunista, al revés: mostrás que
el trabajo se multiplicó y que vos estás poniendo plata de tu bolsillo en
esa diferencia.

> "Che, quería hablarte de la app antes de seguir. Cuando arrancamos era
> básicamente reemplazar las planillas — pero terminamos armando bastante más:
> el módulo de cuenta corriente con cheques, alertas de vencimiento, carga de
> facturas con foto, todo lo de pedidos y estadísticas. Ya es un sistema
> bastante grande, no la app 'sencilla' que hablamos al principio.
>
> Te tiro los números para que veas en qué anda esto. Cotizado como se
> cotizaría afuera — un freelancer armando esto de cero, a precio de mercado —
> esto sale entre **USD 3.000 y 3.500**. A vos obviamente no te voy a cobrar
> eso.
>
> Te lo voy a cobrar a **USD 1.600** (unas 80 horas reales de laburo a USD
> 20 la hora) — menos de la mitad. Sé que la tarifa la conversamos hace
> rato, así que si te suena bien lo arrancamos a cobrar, y si querés lo
> hablamos y vemos cómo lo hacemos — en cuotas, por módulo, como te sea más
> cómodo. No quiero que sea un golpe sorpresa."

## Opciones para que aterrice mejor (por ser amigo)

- **Pago en cuotas**: por ejemplo 3 pagos de ~USD 533, o dividido por hito
  (pedidos + estadísticas / cuenta corriente / ajustes finales).
- **Congelar el precio de acá para adelante**: dejar en claro que este número
  cierra "lo hecho hasta ahora", y que cambios chicos futuros (ajustar un
  texto, un color) van por fuera del cobro, pero features nuevas (otro
  módulo, otro reporte) se cotizan aparte — así no vuelve a pasar lo mismo
  de "empezó chico y creció sin que quede claro el costo".
- **Ofrecer valor a futuro**: si el negocio le está funcionando con la app,
  podés plantear una tarifa reducida de mantenimiento mensual en vez de cobrar
  cada cambio suelto — más previsible para los dos.
