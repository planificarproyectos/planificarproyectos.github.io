# Bitácora Mindfocus

Registro diario de actividades (7:00 a.m. – 9:00 p.m.) con cronómetro, categorías y análisis de productividad por día, semana, mes, trimestre, semestre, año o rango personalizado.

- Acceso con correo y contraseña (Firebase Authentication).
- Datos en Cloud Firestore, privados por usuario: cada cuenta solo puede leer y escribir `users/{uid}/…`.
- `firebase-config.js` contiene la configuración pública del proyecto; no es secreta.
- Exportación CSV y respaldo/importación en JSON desde la pestaña Análisis.
