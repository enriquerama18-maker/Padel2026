/* ==========================================================
   INSCRIPCIÓN ONLINE (inscripcion.html)
   1) Guarda la pareja en la base de datos como "pendiente".
      (el organizador la ve al instante en el panel y la confirma)
   2) Prepara el mensaje de WhatsApp al número del dueño.
   ========================================================== */

let ultimaInscripcion = null;

document.addEventListener('DOMContentLoaded', () => {
  $('demoBanner').innerHTML = demoBannerHtml();

  $('pairRama').innerHTML = APP_CONFIG.ramas
    .map((r) => `<option value="${esc(r.value)}">${esc(r.label)}</option>`).join('');
  $('pairCategory').innerHTML = APP_CONFIG.categorias
    .map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('');

  DB.init();
  DB.subscribe('config', (list) => {
    const c = list.find((x) => x.id === 'torneo');
    if (c) State.config = { ...State.config, ...c };
    $('tournamentName').textContent = State.config.nombre || 'Torneo de Pádel';
    const abierta = State.config.inscripcionAbierta !== false;
    if (!ultimaInscripcion) {
      $('formCard').classList.toggle('hidden', !abierta);
      $('closedCard').classList.toggle('hidden', abierta);
    }
  });
});

async function enviarInscripcion(e) {
  e.preventDefault();

  // Anti-spam: campo trampa + una inscripción cada 10 segundos
  if ($('website').value) return;
  const ultima = Number(sessionStorage.getItem('padel_ultima_insc') || 0);
  if (Date.now() - ultima < 10000) { showToast('Esperá unos segundos para enviar otra', 'info'); return; }

  const p1 = $('player1Name').value.trim();
  const p2 = $('player2Name').value.trim();
  const rama = $('pairRama').value;
  const categoria = $('pairCategory').value;
  const telefono = $('pairPhone').value.trim();

  if (p1.length < 3 || p2.length < 3) { showToast('Completá nombre y apellido de ambos jugadores', 'error'); return; }
  if (telefono.replace(/[^0-9]/g, '').length < 8) { showToast('Ingresá un WhatsApp válido', 'error'); return; }

  const btn = $('btnEnviar');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

  const id = DB.newId('parejas');
  try {
    await DB.batch([
      { type: 'set', col: 'parejas', id, data: { p1, p2, rama, categoria, grupo: '', confirmada: false, creada: Date.now() } },
      { type: 'set', col: 'contactos', id, data: { telefono, creada: Date.now() } }
    ]);
  } catch (err) {
    console.error(err);
    showToast('No se pudo enviar. Revisá tu conexión e intentá de nuevo.', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar inscripción';
    return;
  }

  sessionStorage.setItem('padel_ultima_insc', String(Date.now()));
  ultimaInscripcion = { p1, p2, rama, categoria, telefono };

  // Mensaje de WhatsApp para el dueño
  const msg = `🎾 *Nueva inscripción* - ${State.config.nombre}\n` +
    `👥 ${p1} / ${p2}\n` +
    `🏆 ${categoria} - ${ramaLabel(rama)}\n` +
    `📱 WhatsApp: ${telefono}\n\n` +
    `Ya quedó cargada en el sistema, falta tu confirmación.`;
  const url = waLink(State.config.whatsappDueno || APP_CONFIG.whatsappDueno, msg);

  $('okDetail').textContent = `${p1} / ${p2} · ${categoria} ${ramaLabel(rama)}`;
  $('btnWhats').href = url;
  $('formCard').classList.add('hidden');
  $('okCard').classList.remove('hidden');

  // Intento de abrir WhatsApp automáticamente (algunos celulares lo bloquean; para eso está el botón)
  window.open(url, '_blank');
}

function otraInscripcion() {
  ultimaInscripcion = null;
  $('inscForm').reset();
  $('okCard').classList.add('hidden');
  $('formCard').classList.remove('hidden');
  const btn = $('btnEnviar');
  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar inscripción';
}
