# Lumen

App web católica para la vida de fe diaria. Publicada en https://www.planificarproyectos.com/lumen/

- **Misa de hoy** con botón ▶: lee en voz alta toda la estructura de la Misa con las lecturas reales del día (calendario litúrgico y Leccionario: ciclo dominical A/B/C, ferial I/II, santos y solemnidades; Epifanía, Ascensión y Corpus Christi en domingo, como en Colombia).
- **Santo Rosario** guiado, con indicador en forma de rosario horizontal, misterios según el día y rezo continuo con voz.
- **Biblia** completa (Reina-Valera 1909, dominio público, ortografía actualizada), disponible sin conexión.
- Frase del día (del Evangelio), rutina de oración con racha, oraciones completas, selector de color y modo claro/oscuro.
- Instalable como app (Android e iPhone) y funciona sin conexión.

Cuentas con correo y contraseña (Firebase Auth, mismo proyecto que Mind Focus y PowerFit). Datos en Firestore: `users/{uid}/lumen`.

Fuentes: calendario y leccionario derivados de Liturgical Calendar API (Apache-2.0) y del Ordo Lectionum Missae; Biblia Reina-Valera 1909 (dominio público). Esta edición bíblica no incluye Tobías, Judit, Sabiduría, Eclesiástico, Baruc ni 1-2 Macabeos; esos días la app lo indica.
