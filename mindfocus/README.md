# Mind Focus

Registro de las 24 horas del día con botones de un toque, pomodoro, categorías y análisis de productividad por día, semana, mes, trimestre, semestre, año o rango personalizado.

- Acceso con correo y contraseña (Firebase Authentication).
- Datos en Cloud Firestore, privados por usuario: cada cuenta solo puede leer y escribir `users/{uid}/…`.
- `firebase-config.js` contiene la configuración pública del proyecto; no es secreta.
- Exportación CSV y respaldo/importación en JSON desde la pestaña Análisis.
