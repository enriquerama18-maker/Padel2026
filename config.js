/* ==========================================================
   CONFIGURACIÓN GENERAL  -  Es el ÚNICO archivo que tenés que
   completar para poner la plataforma en funcionamiento.
   ========================================================== */

const APP_CONFIG = {

  // 1) DATOS DE FIREBASE (los copiás desde la consola de Firebase).
  //    Mientras estén vacíos, la app funciona en MODO DEMO
  //    (los datos se guardan solo en tu navegador, sirve para probar).
  firebase: {
    apiKey: "AIzaSyDfhNs6Ny5HPmYmE5lV-CJnEF3uz4oegXw",
    authDomain: "padel-torneo2026.firebaseapp.com",
    projectId: "padel-torneo2026",
    storageBucket: "padel-torneo2026.firebasestorage.app",
    messagingSenderId: "394833758954",
    appId: "1:394833758954:web:25f11ba5da8fee6b5a2593"
  },

  // 2) EMAIL del dueño (el mismo que vas a crear en Firebase Authentication)
  adminEmail: "dueno@tuclub.com",

  // 3) WHATSAPP del dueño, con código de país, sin + ni espacios.
  //    Argentina (celular): 549 + código de área sin 0 + número sin 15
  //    Ejemplo Formosa: 5493704123456
  whatsappDueno: "5493704123456",

  // 4) Categorías y ramas disponibles (editables)
  categorias: ["4ta", "5ta", "6ta", "7ma", "8va", "Suma 11", "Suma 13"],
  ramas: [
    { value: "Masculino", label: "Caballeros" },
    { value: "Femenino", label: "Damas" },
    { value: "Mixto", label: "Mixto" }
  ],

  // Contraseña del MODO DEMO (solo se usa cuando Firebase no está configurado)
  demoPassword: "1234"
};

APP_CONFIG.usaFirebase = !!APP_CONFIG.firebase.apiKey;
