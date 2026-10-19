// Soporte Wellness Apps (Mind Focus, PowerFit, Lumen).
// Para cambiar el número de WhatsApp, edita SOLO esta línea (indicativo de país + número, sin espacios ni "+").
window.WELLNESS_WHATSAPP = "573204451740";

// Página que reúne todas las apps (botón al final de Cuenta).
window.WELLNESS_APPS_URL = "https://www.planificarproyectos.com/wellness-apps/";

// Arma el enlace de WhatsApp con un mensaje inicial.
// tipo: "soporte" | "recomendacion"
window.wellnessWA = function (app, tipo, email) {
  var n = String(window.WELLNESS_WHATSAPP || "").replace(/\D/g, "");
  var t = tipo === "recomendacion"
    ? "Hola, tengo una recomendación para " + app + ": "
    : "Hola, necesito ayuda con " + app + ": ";
  if (email) t += "\n\n(Cuenta: " + email + ")";
  return "https://wa.me/" + n + "?text=" + encodeURIComponent(t);
};
