# Lumen

App web católica para la vida de fe diaria. Publicada en https://www.planificarproyectos.com/lumen/

- **Misa de hoy** con botón ▶: lee en voz alta toda la estructura de la Misa con las lecturas reales del día (calendario litúrgico y Leccionario: ciclo dominical A/B/C, ferial I/II, santos y solemnidades; Epifanía, Ascensión y Corpus Christi en domingo, como en Colombia).
- **Santo Rosario** guiado, con indicador en forma de rosario horizontal, misterios según el día y rezo continuo con voz.
- **Biblia católica completa** (73 libros), disponible sin conexión, con búsqueda por cita o palabras.
- **Planes de lectura**: Evangelios en 30 días, Nuevo Testamento en 90, Salmos en 30, Proverbios en 31 y la Biblia en un año, con avance guardado en la cuenta.
- **Compartir como imagen**: la frase del día o los versículos que selecciones, listos para WhatsApp o Instagram.
- **Recordatorios** (Ángelus, oración de la mañana, Rosario, plan de lectura, Misa del domingo) que se agregan al calendario del celular.
- Reproductor flotante para pausar, reanudar o detener la lectura al cambiar de sección.
- Frase del día (del Evangelio), rutina de oración con racha, oraciones completas, selector de color y modo claro/oscuro.
- Instalable como app (Android e iPhone) y funciona sin conexión.

Cuentas con correo y contraseña (Firebase Auth, mismo proyecto que Mind Focus y PowerFit). Datos en Firestore: `users/{uid}/lumen`.

Fuentes: calendario y leccionario derivados de Liturgical Calendar API (Apache-2.0) y del Ordo Lectionum Missae. Biblia: Reina-Valera 1909 (dominio público, ortografía actualizada); Tobías, Judit, 1 y 2 Macabeos, Sabiduría, Eclesiástico, Baruc y los libros de Ester y Daniel con sus partes griegas, de la *Santa Biblia libre para el mundo* (eBible.org, dominio público; borrador de traducción). Los libros 67-73 se agregan sin cambiar la numeración 1-66.
