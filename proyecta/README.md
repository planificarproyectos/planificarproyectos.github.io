# Proyecta

Modelo financiero inmobiliario para proyectos de vivienda en Colombia.

- Etapas y tipologías (apartamentos, parqueaderos, depósitos, locales), lista de precios por piso y vista, topes VIS/VIP.
- Curva de ventas, plan de pagos (separación, cesantías, primas), desistimientos y subsidios.
- Presupuesto por capítulos con curva S e índice ICCV, lote (contado, diferido, especie o área), licencias, indirectos y posventa.
- IVA y devolución VIS, ICA, 4x1000 y renta según vehículo (fiducia o sociedad).
- Crédito constructor (IBR + spread), crédito puente, fiducia y socios con TIR antes y después de impuestos.
- Estado de resultados, balance proyectado, seguimiento contra presupuesto, versiones, sensibilidad, informe para comité y exportación a Excel.

Publicada en https://www.planificarproyectos.com/proyecta/

Cuentas con correo y contraseña (Firebase Auth, mismo proyecto que Mindfocus y PowerFit). Datos en Firestore: users/{uid}/proyecta (proyectos `p_*`, versiones `v_*` y supuestos macro `macro`), con las mismas reglas e invitaciones de Mindfocus. Se puede instalar en el celular con "Agregar a pantalla de inicio".

En el computador (1024 px o más) cada sección de la barra inferior se suma como una columna; las columnas se reordenan arrastrando su encabezado.
