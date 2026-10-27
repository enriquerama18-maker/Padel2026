/* ==========================================================
   PANEL DEL ORGANIZADOR (admin.html)
   - Login real (Firebase Authentication)
   - Parejas, partidos, resultados, sorteos, inscripciones
   ========================================================== */

let panelIniciado = false;
let pendientesConocidos = null;

/* ---------------- ARRANQUE + LOGIN ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  DB.init();
  if (DB.modo === 'local') $('demoHint').classList.remove('hidden');

  DB.onAuth((user) => {
    if (!user) { mostrarLogin(); return; }
    // Doble control: solo el email del dueño entra (las reglas de la base lo exigen igual)
    if (DB.modo === 'firebase' && APP_CONFIG.adminEmail &&
        user.email.toLowerCase() !== APP_CONFIG.adminEmail.toLowerCase()) {
      DB.logout();
      mostrarLogin('Esta cuenta no tiene permisos de organizador.');
      return;
    }
    entrarAlPanel();
  });
});

function mostrarLogin(msg) {
  $('loginScreen').classList.remove('hidden');
  $('app').classList.add('hidden');
  $('app').classList.remove('flex');
  if (msg) { $('loginError').textContent = msg; $('loginError').classList.remove('hidden'); }
}

async function doLogin(e) {
  e.preventDefault();
  const btn = $('loginBtn');
  $('loginError').classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Ingresando...';
  try {
    await DB.login($('loginEmail').value.trim(), $('loginPass').value);
  } catch (err) {
    const bad = ['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential', 'auth/invalid-email'];
    $('loginError').textContent = bad.includes(err.code) ? 'Email o contraseña incorrectos.' : 'No se pudo ingresar: ' + (err.code || err.message);
    $('loginError').classList.remove('hidden');
  }
  btn.disabled = false;
  btn.textContent = 'Ingresar';
}

function logout() { DB.logout(); }

function entrarAlPanel() {
  isAdmin = true;
  $('loginScreen').classList.add('hidden');
  $('app').classList.remove('hidden');
  $('app').classList.add('flex');
  if (panelIniciado) return;
  panelIniciado = true;

  buildShell(true);
  initFilters();
  fillSelect('pairRama', APP_CONFIG.ramas.map((r) => [r.value, r.label]));
  fillSelect('pairCategory', APP_CONFIG.categorias.map((c) => [c, c]), '6ta');
  fillSelect('matchRama', APP_CONFIG.ramas.map((r) => [r.value, r.label]));
  fillSelect('matchCategory', APP_CONFIG.categorias.map((c) => [c, c]), '6ta');

  // Datos en TIEMPO REAL
  DB.subscribe('config', (list) => {
    const c = list.find((x) => x.id === 'torneo');
    if (c) State.config = { ...State.config, ...c };
    renderHeader();
  });
  DB.subscribe('parejas', (list) => { State.pairs = list; detectarNuevasInscripciones(list); renderAll(); });
  DB.subscribe('contactos', (list) => {
    State.contacts = {};
    list.forEach((c) => { State.contacts[c.id] = c; });
    renderAll();
  });
  DB.subscribe('partidos', (list) => { State.matches = list; renderAll(); });

  renderHeader();
  renderAll();
}

function fillSelect(id, options, selected) {
  $(id).innerHTML = options.map(([v, l]) => `<option value="${esc(v)}" ${v === selected ? 'selected' : ''}>${esc(l)}</option>`).join('');
}

function renderAdminExtras() {
  renderPairs();
  renderSorteo();
}

/* ---------------- AVISO DE NUEVAS INSCRIPCIONES ---------------- */
function detectarNuevasInscripciones(list) {
  const pend = list.filter((p) => p.confirmada === false);
  if (pendientesConocidos) {
    pend.filter((p) => !pendientesConocidos.has(p.id))
      .forEach((p) => showToast(`🔔 Nueva inscripción: ${p.p1} / ${p.p2}`, 'info'));
  }
  pendientesConocidos = new Set(pend.map((p) => p.id));

  const badge = $('pendingBadge');
  if (badge) {
    badge.textContent = pend.length;
    badge.classList.toggle('hidden', pend.length === 0);
  }
}

/* ---------------- INSCRIPTOS / PAREJAS ---------------- */
function renderPairs() {
  const tbody = $('pairsTableBody');
  if (!tbody) return;
  const search = ($('searchPairInput')?.value || '').toLowerCase().trim();
  const rama = $('filterRama').value;
  const cat = $('filterCategoria').value;

  const filtered = State.pairs.filter((p) => {
    if (rama !== 'ALL' && p.rama !== rama) return false;
    if (cat !== 'ALL' && p.categoria !== cat) return false;
    if (search && !p.p1.toLowerCase().includes(search) && !p.p2.toLowerCase().includes(search)) return false;
    return true;
  }).sort((a, b) => (a.confirmada === false ? 0 : 1) - (b.confirmada === false ? 0 : 1) || (b.creada || 0) - (a.creada || 0));

  $('pairsCountBadge').textContent = filtered.length;

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-3 py-6 text-center text-slate-500 text-xs">No hay parejas que coincidan.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((p) => {
    const pendiente = p.confirmada === false;
    const tel = (State.contacts[p.id] || {}).telefono;
    return `
      <tr class="hover:bg-slate-800/40 transition ${pendiente ? 'bg-amber-500/5' : ''}">
        <td class="px-3 py-2 font-bold text-white">
          <div class="flex items-center gap-1.5 truncate max-w-[150px] sm:max-w-none">
            <i class="fa-solid fa-user-group text-neon text-[10px]"></i>
            <span class="truncate">${esc(p.p1)} &amp; ${esc(p.p2)}</span>
          </div>
        </td>
        <td class="px-3 py-2"><span class="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px] border border-slate-700">${esc(ramaLabel(p.rama))} - ${esc(p.categoria)}</span></td>
        <td class="px-3 py-2 text-[11px]">
          ${pendiente
            ? '<span class="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black px-1.5 py-0.5 rounded-full">PENDIENTE</span>'
            : `<span class="text-neon font-semibold">${esc(p.grupo || 'Sin zona')}</span>`}
        </td>
        <td class="px-3 py-2">
          ${tel ? `<a href="${waLink(tel, 'Hola! Te escribo por la inscripción al torneo ' + State.config.nombre)}" target="_blank" class="text-emerald-400 hover:underline flex items-center gap-1 font-mono text-[11px]"><i class="fa-brands fa-whatsapp"></i> ${esc(tel)}</a>` : '<span class="text-slate-600">-</span>'}
        </td>
        <td class="px-3 py-2 text-right whitespace-nowrap">
          ${pendiente ? `<button onclick="confirmarPareja('${p.id}')" class="px-2 py-1 bg-neon hover:bg-neon/90 text-slate-950 font-bold text-[10px] rounded-lg mr-1"><i class="fa-solid fa-check"></i> Confirmar</button>` : ''}
          <button onclick="openPairModal('${p.id}')" class="p-1 text-slate-400 hover:text-neon rounded"><i class="fa-solid fa-pen text-xs"></i></button>
          <button onclick="deletePairPrompt('${p.id}')" class="p-1 text-slate-400 hover:text-red-400 rounded ml-1"><i class="fa-solid fa-trash text-xs"></i></button>
        </td>
      </tr>`;
  }).join('');
}

function confirmarPareja(id) {
  run(() => DB.set('parejas', id, { confirmada: true }), 'Pareja confirmada');
}

function openPairModal(id = null) {
  $('pairForm').reset();
  $('pairId').value = '';
  $('pairModalTitle').innerHTML = '<i class="fa-solid fa-user-group text-neon"></i> Inscribir Pareja';
  if (id) {
    const p = State.pairs.find((x) => x.id === id);
    if (p) {
      $('pairId').value = p.id;
      $('player1Name').value = p.p1;
      $('player2Name').value = p.p2;
      $('pairRama').value = p.rama;
      $('pairCategory').value = p.categoria;
      $('pairGroup').value = p.grupo || '';
      $('pairPhone').value = (State.contacts[p.id] || {}).telefono || '';
      $('pairModalTitle').innerHTML = '<i class="fa-solid fa-pen text-neon"></i> Modificar Pareja';
    }
  }
  openModal('pairModal');
}

async function savePair(e) {
  e.preventDefault();
  const existing = $('pairId').value;
  const id = existing || DB.newId('parejas');
  const data = {
    p1: $('player1Name').value.trim(),
    p2: $('player2Name').value.trim(),
    rama: $('pairRama').value,
    categoria: $('pairCategory').value,
    grupo: $('pairGroup').value.trim()
  };
  if (!existing) { data.confirmada = true; data.creada = Date.now(); }

  const ops = [{ type: 'set', col: 'parejas', id, data }];
  const tel = $('pairPhone').value.trim();
  if (tel || existing) ops.push({ type: 'set', col: 'contactos', id, data: { telefono: tel } });

  const ok = await run(() => DB.batch(ops), existing ? 'Pareja actualizada' : 'Pareja registrada');
  if (ok) closeModal('pairModal');
}

function deletePairPrompt(id) {
  const p = State.pairs.find((x) => x.id === id);
  if (!p) return;
  if (!confirm(`¿Eliminar la pareja ${p.p1} & ${p.p2}? Se eliminarán sus partidos.`)) return;
  const ops = [
    { type: 'delete', col: 'parejas', id },
    { type: 'delete', col: 'contactos', id },
    ...State.matches.filter((m) => m.pair1Id === id || m.pair2Id === id)
      .map((m) => ({ type: 'delete', col: 'partidos', id: m.id }))
  ];
  run(() => DB.batch(ops), 'Pareja eliminada');
}

/* ---------------- PARTIDOS ---------------- */
function openMatchModal() {
  $('matchForm').reset();
  $('matchId').value = '';
  $('matchModalTitle').innerHTML = '<i class="fa-solid fa-calendar-plus text-neon"></i> Programar Partido';
  $('matchDate').value = new Date().toISOString().split('T')[0];
  $('matchTime').value = '19:00';
  $('matchCourt').value = 'Cancha 1';
  onMatchCategoryChange();
  openModal('matchModal');
}

function openEditMatchModal(id) {
  const m = State.matches.find((x) => x.id === id);
  if (!m) return;
  $('matchId').value = m.id;
  $('matchModalTitle').innerHTML = '<i class="fa-solid fa-clock-rotate-left text-neon"></i> Horario / Cancha';
  $('matchRama').value = m.rama;
  $('matchCategory').value = m.categoria;
  $('matchPhase').value = m.fase;
  $('matchDate').value = m.date || new Date().toISOString().split('T')[0];
  $('matchTime').value = m.time || '19:00';
  $('matchCourt').value = m.court || 'Cancha 1';
  onMatchCategoryChange();
  $('matchPair1').value = m.pair1Id || '';
  $('matchPair2').value = m.pair2Id || '';
  openModal('matchModal');
}

function onMatchCategoryChange() {
  const eligible = confirmedPairs($('matchRama').value, $('matchCategory').value);
  const opts = '<option value="">— Por definir —</option>' +
    eligible.map((p) => `<option value="${p.id}">${esc(p.p1)} &amp; ${esc(p.p2)} (${esc(p.grupo || 'Sin zona')})</option>`).join('');
  $('matchPair1').innerHTML = opts;
  $('matchPair2').innerHTML = opts;
  if (!$('matchId').value) {
    if (eligible.length > 0) $('matchPair1').selectedIndex = 1;
    if (eligible.length > 1) $('matchPair2').selectedIndex = 2;
  }
}

async function saveMatch(e) {
  e.preventDefault();
  const id = $('matchId').value;
  const pair1Id = $('matchPair1').value || null;
  const pair2Id = $('matchPair2').value || null;
  const fase = $('matchPhase').value;

  if (!id && (!pair1Id || !pair2Id)) { showToast('Elegí las dos parejas', 'error'); return; }
  if (pair1Id && pair1Id === pair2Id) { showToast('Deben ser dos parejas distintas', 'error'); return; }

  const data = {
    rama: $('matchRama').value,
    categoria: $('matchCategory').value,
    fase, ronda: rondaDeFase(fase),
    pair1Id, pair2Id,
    date: $('matchDate').value,
    time: $('matchTime').value,
    court: $('matchCourt').value.trim()
  };

  let mid = id;
  if (!id) {
    mid = DB.newId('partidos');
    Object.assign(data, { id: mid, grupo: '', status: 'Programado', winnerId: null, sets: [], next: null });
  }
  const ok = await run(() => DB.set('partidos', mid, data), id ? 'Partido actualizado' : 'Partido programado');
  if (ok) closeModal('matchModal');
}

function deleteMatchPrompt(id) {
  if (!confirm('¿Seguro que querés eliminar este partido?')) return;
  run(() => DB.remove('partidos', id), 'Partido eliminado');
}

/* ---------------- RESULTADOS ---------------- */
function openResultModal(id) {
  const m = State.matches.find((x) => x.id === id);
  if (!m) return;
  if (!m.pair1Id || !m.pair2Id) { showToast('Todavía faltan definir las parejas de este partido', 'info'); return; }

  $('resultMatchId').value = m.id;
  $('resultModalMatchInfo').textContent = `${m.court || 'Cancha a definir'} • ${m.categoria} (${ramaLabel(m.rama)}) - ${m.fase}`;
  $('resultPair1Name').textContent = pairNames(m.pair1Id).replace(' / ', ' & ');
  $('resultPair2Name').textContent = pairNames(m.pair2Id).replace(' / ', ' & ');
  $('resultStatus').value = m.status === 'Programado' ? 'Finalizado' : (m.status || 'Finalizado');

  [0, 1, 2].forEach((i) => {
    const s = (m.sets || [])[i];
    $(`p1_s${i + 1}`).value = s ? s.p1 : '';
    $(`p2_s${i + 1}`).value = s ? s.p2 : '';
  });

  $('resultWinner').value = m.winnerId === m.pair1Id ? 'pair1' : m.winnerId === m.pair2Id ? 'pair2' : 'auto';
  openModal('resultModal');
}

async function saveResult(e) {
  e.preventDefault();
  const m = State.matches.find((x) => x.id === $('resultMatchId').value);
  if (!m) return;

  const sets = [];
  let w1 = 0, w2 = 0;
  [1, 2, 3].forEach((i) => {
    const a = parseInt($(`p1_s${i}`).value, 10);
    const b = parseInt($(`p2_s${i}`).value, 10);
    if (!isNaN(a) && !isNaN(b)) {
      sets.push({ p1: a, p2: b });
      if (a > b) w1++; else if (b > a) w2++;
    }
  });

  const status = $('resultStatus').value;
  const man = $('resultWinner').value;
  let winnerId = null;
  if (man === 'pair1') winnerId = m.pair1Id;
  else if (man === 'pair2') winnerId = m.pair2Id;
  else if (w1 > w2) winnerId = m.pair1Id;
  else if (w2 > w1) winnerId = m.pair2Id;

  if (status === 'Finalizado' && !winnerId) {
    showToast('Cargá los sets o elegí el ganador manualmente', 'error');
    return;
  }

  const upd = { sets, status, winnerId: status === 'Finalizado' ? winnerId : null };
  const ok = await run(async () => {
    await DB.set('partidos', m.id, upd);
    await propagarGanador({ ...m, ...upd });   // el ganador pasa solo a la siguiente instancia
  }, 'Marcador guardado · ya visible para los jugadores');
  if (ok) closeModal('resultModal');
}

async function clearMatchResult() {
  const m = State.matches.find((x) => x.id === $('resultMatchId').value);
  if (!m) return;
  const upd = { sets: [], winnerId: null, status: 'Programado' };
  const ok = await run(async () => {
    await DB.set('partidos', m.id, upd);
    await propagarGanador({ ...m, ...upd });
  }, 'Marcador borrado');
  if (ok) closeModal('resultModal');
}

/* ---------------- SORTEO ---------------- */
function renderSorteo() {
  const box = $('sorteoContainer');
  if (!box) return;
  const ramaF = $('filterRama').value;
  const catF = $('filterCategoria').value;
  const cards = [];

  APP_CONFIG.ramas.forEach((r) => APP_CONFIG.categorias.forEach((cat) => {
    if (ramaF !== 'ALL' && r.value !== ramaF) return;
    if (catF !== 'ALL' && cat !== catF) return;

    const pairs = confirmedPairs(r.value, cat);
    const pend = State.pairs.filter((p) => p.confirmada === false && p.rama === r.value && p.categoria === cat).length;
    if (!pairs.length && !pend) return;

    const ms = State.matches.filter((m) => m.rama === r.value && m.categoria === cat);
    const gm = ms.filter((m) => getRonda(m) === 0);
    const km = ms.filter((m) => getRonda(m) > 0);
    const done = (a) => a.filter((m) => m.status === 'Finalizado').length;
    const zonas = Object.keys(getZonas(r.value, cat)).filter((z) => z !== 'Sin zona').length;
    const rn = (v) => `'${r.value}','${cat}'`;
    const dis = (cond) => (cond ? '' : 'opacity-40 pointer-events-none');

    cards.push(`
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-xl space-y-2.5">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <h3 class="font-bold text-white text-sm flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-neon"></span> ${esc(cat)} - ${esc(r.label)}</h3>
          <span class="text-[10px] bg-slate-800 text-neon font-black px-2 py-0.5 rounded-full border border-slate-700">${pairs.length} parejas</span>
        </div>
        ${pend ? `<p class="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2 py-1"><i class="fa-solid fa-bell mr-1"></i>${pend} inscripción(es) pendiente(s) de confirmar (no entran al sorteo).</p>` : ''}
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div class="bg-slate-950 border border-slate-800 rounded-xl p-2">
            <div class="text-slate-400 font-bold text-[9px] uppercase">Fase de grupos</div>
            <div class="text-white font-semibold">${gm.length ? `${zonas} zona(s) · ${done(gm)}/${gm.length} jugados` : 'Sin sortear'}</div>
          </div>
          <div class="bg-slate-950 border border-slate-800 rounded-xl p-2">
            <div class="text-slate-400 font-bold text-[9px] uppercase">Llave</div>
            <div class="text-white font-semibold">${km.length ? `${km.length} partidos · ${done(km)} jugados` : 'Sin generar'}</div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-1.5 text-[11px] font-bold">
          <button onclick="sorteoZonasPrompt(${rn()})" class="py-2 rounded-xl bg-neon hover:bg-neon/90 text-slate-950 flex items-center justify-center gap-1 ${dis(pairs.length >= 3)}"><i class="fa-solid fa-dice"></i> Sortear zonas</button>
          <button onclick="accionLlave(${rn()})" class="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 ${dis(gm.length)}"><i class="fa-solid fa-sitemap"></i> Generar llave</button>
          <button onclick="accionDirecta(${rn()})" class="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1 ${dis(pairs.length >= 2)}"><i class="fa-solid fa-bolt text-amber-400"></i> Eliminación directa</button>
          <button onclick="accionBorrarSorteo(${rn()})" class="py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-red-400 border border-slate-700 flex items-center justify-center gap-1 ${dis(ms.length)}"><i class="fa-solid fa-trash-can"></i> Borrar sorteo</button>
        </div>
      </div>`);
  }));

  box.innerHTML = cards.length ? cards.join('') : `
    <div class="md:col-span-2 py-12 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
      <i class="fa-solid fa-dice text-3xl text-slate-600 mb-1.5 block"></i>
      <p class="text-slate-400 text-xs">Todavía no hay parejas inscriptas para sortear.</p>
    </div>`;
}

function sorteoZonasPrompt(rama, cat) {
  $('sorteoRama').value = rama;
  $('sorteoCat').value = cat;
  $('sorteoModalInfo').textContent = `${cat} - ${ramaLabel(rama)} · ${confirmedPairs(rama, cat).length} parejas confirmadas`;
  previewSorteo();
  openModal('sorteoModal');
}

function previewSorteo() {
  const n = confirmedPairs($('sorteoRama').value, $('sorteoCat').value).length;
  const size = Number($('sorteoSize').value);
  const g = Math.max(1, Math.round(n / size));
  const base = Math.floor(n / g), extra = n % g;
  const detalle = extra ? `${extra} zona(s) de ${base + 1} y ${g - extra} de ${base}` : `${g} zona(s) de ${base}`;
  $('sorteoPreview').innerHTML = `<i class="fa-solid fa-eye text-neon mr-1"></i> ${n} parejas → <strong>${detalle}</strong>. Clasifican ${g === 1 ? Math.min(4, n)  : g * 2} a la llave.`;
}

async function confirmSorteoZonas() {
  const rama = $('sorteoRama').value, cat = $('sorteoCat').value;
  const hay = State.matches.some((m) => m.rama === rama && m.categoria === cat);
  if (hay && !confirm('Ya existe un sorteo para esta categoría. Se borrarán sus partidos y resultados. ¿Continuar?')) return;
  const r = await sorteoSeguro(() => sortearZonas(rama, cat, Number($('sorteoSize').value)));
  if (r && r.ok) closeModal('sorteoModal');
}

async function accionLlave(rama, cat) {
  const gm = State.matches.filter((m) => m.rama === rama && m.categoria === cat && getRonda(m) === 0);
  const pendientes = gm.filter((m) => m.status !== 'Finalizado').length;
  if (pendientes && !confirm(`Faltan ${pendientes} partido(s) de zona por jugar. La llave se arma con las posiciones actuales. ¿Generar igual?`)) return;
  if (State.matches.some((m) => m.rama === rama && m.categoria === cat && getRonda(m) > 0) &&
      !confirm('Ya hay una llave generada. Se reemplazará. ¿Continuar?')) return;
  await sorteoSeguro(() => generarLlave(rama, cat));
}

async function accionDirecta(rama, cat) {
  if (State.matches.some((m) => m.rama === rama && m.categoria === cat) &&
      !confirm('Se borrarán los partidos actuales de esta categoría y se sorteará una llave directa. ¿Continuar?')) return;
  await sorteoSeguro(() => sortearDirecta(rama, cat));
}

async function accionBorrarSorteo(rama, cat) {
  if (!confirm('¿Borrar todos los partidos y resultados de esta categoría?')) return;
  run(() => borrarSorteo(rama, cat), 'Sorteo borrado');
}

async function sorteoSeguro(fn) {
  try {
    const r = await fn();
    showToast(r.msg, r.ok ? 'success' : 'error');
    return r;
  } catch (e) {
    console.error(e);
    showToast('Error: ' + (e.code || e.message), 'error');
    return null;
  }
}

/* ---------------- LINKS ---------------- */
function openShareModal() {
  $('publicLinkInput').value = pageUrl('index.html');
  $('inscLinkInput').value = pageUrl('inscripcion.html');
  $('adminLinkInput').value = pageUrl('admin.html');
  openModal('shareModal');
}

function shareLinkWhatsApp(tipo) {
  const n = State.config.nombre;
  const msg = tipo === 'public'
    ? `🎾 *${n}*\n\nHorarios, canchas, resultados y posiciones en vivo (se actualiza solo):\n${pageUrl('index.html')}`
    : `🎾 *${n}*\n\n¿No podés pasar por el club? Inscribite desde acá:\n${pageUrl('inscripcion.html')}`;
  window.open(waLink('', msg), '_blank');
}

/* ---------------- AJUSTES ---------------- */
function openSettingsModal() {
  toggleDropdown('settingsMenu');
  $('setNombre').value = State.config.nombre || '';
  $('setWhats').value = State.config.whatsappDueno || '';
  $('setAbierta').checked = State.config.inscripcionAbierta !== false;
  openModal('settingsModal');
}

async function saveSettings(e) {
  e.preventDefault();
  const ok = await run(() => DB.set('config', 'torneo', {
    nombre: $('setNombre').value.trim(),
    whatsappDueno: $('setWhats').value.replace(/[^0-9]/g, ''),
    inscripcionAbierta: $('setAbierta').checked
  }), 'Ajustes guardados');
  if (ok) closeModal('settingsModal');
}

/* ---------------- RESPALDO / REINICIO ---------------- */
function exportData() {
  toggleDropdown('settingsMenu');
  const data = { config: State.config, parejas: State.pairs, contactos: State.contacts, partidos: State.matches };
  const a = document.createElement('a');
  a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  a.download = `padel_${(State.config.nombre || 'torneo').toLowerCase().replace(/\s+/g, '_')}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast('Respaldo descargado');
}

function importData(e) {
  toggleDropdown('settingsMenu');
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const d = JSON.parse(evt.target.result);
      if (!Array.isArray(d.parejas) || !Array.isArray(d.partidos)) { showToast('Archivo incompatible', 'error'); return; }
      if (!confirm('Se cargarán los datos del respaldo (se suman/actualizan sobre los actuales). ¿Continuar?')) return;
      const strip = ({ id, ...rest }) => rest;
      const ops = [
        { type: 'set', col: 'config', id: 'torneo', data: strip(d.config || {}) },
        ...d.parejas.map((p) => ({ type: 'set', col: 'parejas', id: p.id, data: strip(p) })),
        ...d.partidos.map((m) => ({ type: 'set', col: 'partidos', id: m.id, data: strip(m) })),
        ...Object.entries(d.contactos || {}).map(([id, c]) => ({ type: 'set', col: 'contactos', id, data: strip(c) }))
      ];
      await run(() => DB.batch(ops), 'Torneo restaurado');
    } catch (err) {
      showToast('Error al importar', 'error');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function resetTournamentPrompt() {
  toggleDropdown('settingsMenu');
  if (!confirm('¿Seguro que querés BORRAR TODOS los partidos, parejas e inscripciones?')) return;
  if (!confirm('Última confirmación: esta acción no se puede deshacer.')) return;
  const ops = [
    ...State.matches.map((m) => ({ type: 'delete', col: 'partidos', id: m.id })),
    ...State.pairs.map((p) => ({ type: 'delete', col: 'parejas', id: p.id })),
    ...Object.keys(State.contacts).map((id) => ({ type: 'delete', col: 'contactos', id }))
  ];
  run(() => DB.batch(ops), 'Torneo reiniciado');
}
