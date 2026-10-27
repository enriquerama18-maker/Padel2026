/* ==========================================================
   UTILIDADES COMPARTIDAS
   ========================================================== */

// Estado global en memoria (se llena desde la base de datos en tiempo real)
const State = {
  config: {
    nombre: "Gran Torneo de Pádel",
    whatsappDueno: APP_CONFIG.whatsappDueno,
    inscripcionAbierta: true
  },
  pairs: [],      // parejas (confirmadas y pendientes)
  matches: [],    // partidos
  contacts: {}    // { idPareja: { telefono } }  (solo lo ve el administrador)
};

const $ = (id) => document.getElementById(id);

// Escapa HTML: IMPORTANTE porque los nombres vienen de un formulario público
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function ramaLabel(v) {
  const r = APP_CONFIG.ramas.find((x) => x.value === v);
  return r ? r.label : v;
}

function formatDate(str) {
  if (!str) return '';
  const p = str.split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}` : str;
}

// URL absoluta de otra página del proyecto (index.html, admin.html, etc.)
function pageUrl(file) {
  return new URL(file, window.location.href).href.split('?')[0].split('#')[0];
}

// Normaliza teléfonos argentinos para wa.me
function normalizePhone(raw) {
  let d = String(raw || '').replace(/[^0-9]/g, '');
  if (d.startsWith('0')) d = d.slice(1);
  if (d.length === 10) d = '549' + d;
  return d;
}

function waLink(phone, text) {
  const base = phone ? `https://wa.me/${normalizePhone(phone)}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text || '')}`;
}

function copyText(text, msg) {
  const done = () => showToast(msg || 'Copiado al portapapeles');
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}
function fallbackCopy(text, done) {
  const t = document.createElement('input');
  t.value = text;
  document.body.appendChild(t);
  t.select();
  try { document.execCommand('copy'); done(); } catch (e) { showToast('Copiá el texto manualmente', 'info'); }
  document.body.removeChild(t);
}

function openModal(id) { $(id).classList.remove('hidden'); }
function closeModal(id) { $(id).classList.add('hidden'); }

function showToast(msg, type = 'success') {
  let toast = $('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:w-auto z-[70] transform translate-y-28 opacity-0 transition-all duration-300 pointer-events-none';
    toast.innerHTML = `
      <div class="bg-slate-900/95 backdrop-blur-md border border-neon/50 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 max-w-sm mx-auto sm:max-w-none">
        <i id="toastIcon" class="fa-solid fa-circle-check text-neon text-base flex-shrink-0"></i>
        <span id="toastMessage" class="text-xs font-medium"></span>
      </div>`;
    document.body.appendChild(toast);
  }
  $('toastMessage').textContent = msg;
  const icon = $('toastIcon');
  if (type === 'error') icon.className = 'fa-solid fa-circle-exclamation text-red-400 text-base flex-shrink-0';
  else if (type === 'info') icon.className = 'fa-solid fa-circle-info text-blue-400 text-base flex-shrink-0';
  else icon.className = 'fa-solid fa-circle-check text-neon text-base flex-shrink-0';

  toast.classList.remove('translate-y-28', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-28', 'opacity-0');
  }, 3000);
}

// Aviso visible cuando Firebase todavía no está configurado
function demoBannerHtml() {
  if (APP_CONFIG.usaFirebase) return '';
  return `<div class="bg-amber-500/15 border-b border-amber-500/40 text-amber-300 text-[10px] sm:text-xs text-center px-3 py-1.5 font-semibold">
    <i class="fa-solid fa-flask mr-1"></i> MODO DEMO: los datos se guardan solo en este navegador. Configurá Firebase en js/config.js para publicarlo.
  </div>`;
}

// Ejecuta una acción de base de datos mostrando errores de forma amigable
async function run(fn, okMsg) {
  try {
    await fn();
    if (okMsg) showToast(okMsg);
    return true;
  } catch (e) {
    console.error(e);
    const perm = e && e.code === 'permission-denied';
    showToast(perm ? 'Sin permisos: iniciá sesión como organizador' : 'Error: ' + (e.code || e.message), 'error');
    return false;
  }
}
