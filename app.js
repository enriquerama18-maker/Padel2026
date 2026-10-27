/* ==========================================================
   RENDER COMPARTIDO (público y admin)
   `isAdmin` solo es true en admin.html después de iniciar sesión.
   ========================================================== */

let isAdmin = false;

function initFilters() {
  $('filterRama').innerHTML = '<option value="ALL">Todas las Ramas</option>' +
    APP_CONFIG.ramas.map((r) => `<option value="${esc(r.value)}">${esc(r.label)}</option>`).join('');
  $('filterCategoria').innerHTML = '<option value="ALL">Categorías</option>' +
    APP_CONFIG.categorias.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
}

function renderHeader() {
  $('headerTournamentName').textContent = State.config.nombre || 'Torneo de Pádel';
  document.title = (State.config.nombre || 'Torneo de Pádel') + ' - Pádel Master';
  const btn = $('btnInscribirme');
  if (btn) {
    const abierta = State.config.inscripcionAbierta !== false;
    btn.classList.toggle('hidden', !abierta);
    btn.classList.toggle('flex', abierta);
  }
}

function renderAll() {
  renderMatches();
  renderStandings();
  renderBrackets();
  searchPlayerMatches();
  if (typeof renderAdminExtras === 'function') renderAdminExtras();
}

function applyGlobalFilters() { renderAll(); }

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    const on = btn.getAttribute('data-tab') === tabId;
    btn.classList.toggle('bg-emerald-600', on);
    btn.classList.toggle('text-white', on);
    btn.classList.toggle('shadow-sm', on);
    btn.classList.toggle('text-slate-400', !on);
  });
  document.querySelectorAll('.tab-content').forEach((s) => s.classList.add('hidden'));
  const target = $('tab-' + tabId);
  if (target) target.classList.remove('hidden');
}

/* ---------- helpers de render ---------- */
function pairHtml(id) {
  const n = pairNames(id);
  return n ? esc(n) : '<span class="text-slate-500 italic">Por definir</span>';
}

function getFilteredMatches() {
  const rama = $('filterRama').value;
  const cat = $('filterCategoria').value;
  const estado = $('filterEstado').value;
  return State.matches.filter((m) => {
    if (rama !== 'ALL' && m.rama !== rama) return false;
    if (cat !== 'ALL' && m.categoria !== cat) return false;
    if (estado !== 'ALL' && m.status !== estado) return false;
    return true;
  });
}

/* ---------- FIXTURE ---------- */
function renderMatches() {
  const container = $('matchesContainer');
  const noNotice = $('noMatchesNotice');
  const matches = getFilteredMatches();

  $('statTotalPairs').textContent = State.pairs.filter((p) => p.confirmada !== false).length;
  $('statTotalMatches').textContent = State.matches.length;
  $('statLiveMatches').textContent = State.matches.filter((m) => m.status === 'En juego').length;
  $('statFinishedMatches').textContent = State.matches.filter((m) => m.status === 'Finalizado').length;

  if (matches.length === 0) {
    container.innerHTML = '';
    noNotice.classList.remove('hidden');
    return;
  }
  noNotice.classList.add('hidden');

  const key = (m) => (m.date && m.time ? m.date + m.time : '9999' + (m.orden ?? 0).toString().padStart(4, '0'));
  const sorted = [...matches].sort((a, b) => {
    if (a.status === 'En juego' && b.status !== 'En juego') return -1;
    if (b.status === 'En juego' && a.status !== 'En juego') return 1;
    return key(a).localeCompare(key(b));
  });

  container.innerHTML = sorted.map((m) => {
    let badge;
    if (m.status === 'En juego') {
      badge = '<span class="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse"><i class="fa-solid fa-circle text-[6px]"></i> EN JUEGO</span>';
    } else if (m.status === 'Finalizado') {
      badge = '<span class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-full"><i class="fa-solid fa-check mr-0.5"></i>FINAL</span>';
    } else {
      badge = '<span class="bg-slate-800 text-slate-400 border border-slate-700 text-[9px] font-medium px-1.5 py-0.5 rounded-full"><i class="fa-regular fa-clock mr-0.5"></i>PROGRAMADO</span>';
    }

    const score = (m.sets && m.sets.length)
      ? m.sets.map((s) => `<span class="bg-slate-950 px-1.5 py-0.5 rounded text-white font-mono font-black text-[11px] border border-slate-800">${s.p1}-${s.p2}</span>`).join(' ')
      : '<span class="text-[10px] text-slate-500 italic">Por disputarse</span>';

    const w1 = m.status === 'Finalizado' && m.winnerId && m.winnerId === m.pair1Id;
    const w2 = m.status === 'Finalizado' && m.winnerId && m.winnerId === m.pair2Id;
    const side = (id, win) => `
      <div class="flex items-center justify-between p-2 rounded-xl ${win ? 'bg-emerald-500/15 border border-emerald-500/40 font-bold' : 'bg-slate-900/60'}">
        <div class="flex items-center gap-1.5 truncate pr-1">
          ${win ? '<i class="fa-solid fa-crown text-neon text-[11px]"></i>' : '<i class="fa-solid fa-table-tennis-paddle-ball text-slate-600 text-[10px]"></i>'}
          <span class="text-xs truncate ${win ? 'text-white' : 'text-slate-200'}">${pairHtml(id)}</span>
        </div>
      </div>`;

    const listo = m.pair1Id && m.pair2Id;
    const actions = isAdmin ? `
      <button onclick="openResultModal('${m.id}')" class="px-2 py-1 bg-neon hover:bg-neon/90 text-slate-950 font-bold text-[11px] rounded-lg flex items-center gap-1 shadow-sm ${listo ? '' : 'opacity-40 pointer-events-none'}">
        <i class="fa-solid fa-pen-to-square"></i> Cargar
      </button>
      <button onclick="openEditMatchModal('${m.id}')" class="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs" title="Horario / cancha / parejas">
        <i class="fa-solid fa-clock-rotate-left"></i>
      </button>
      <button onclick="deleteMatchPrompt('${m.id}')" class="p-1 bg-slate-800 hover:bg-red-500/20 text-red-400 rounded-lg text-xs" title="Borrar">
        <i class="fa-solid fa-trash-can"></i>
      </button>` : `
      <button onclick="shareSingleMatchWhatsApp('${m.id}')" class="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-semibold flex items-center gap-1">
        <i class="fa-brands fa-whatsapp text-xs"></i> Compartir
      </button>`;

    return `
      <div class="bg-courtCard border border-slate-800 rounded-2xl p-3 flex flex-col justify-between shadow-xl relative hover:border-slate-700 transition">
        <div>
          <div class="flex items-center justify-between gap-1.5 mb-2">
            <div class="flex items-center gap-1 truncate">
              <span class="text-[9px] font-black uppercase text-neon bg-neon/10 border border-neon/20 px-1.5 py-0.5 rounded-md">${esc(m.categoria)} - ${esc(ramaLabel(m.rama))}</span>
              <span class="text-[10px] text-slate-400 truncate">${esc(m.fase)}${m.grupo ? ' · ' + esc(m.grupo) : ''}</span>
            </div>
            ${badge}
          </div>
          <div class="flex items-center text-[11px] text-slate-300 gap-1.5 mb-2.5 pb-2 border-b border-slate-800/80 flex-wrap">
            <span class="font-bold text-white flex items-center gap-1 truncate"><i class="fa-solid fa-location-dot text-neon text-[10px]"></i> ${esc(m.court) || 'Cancha a definir'}</span>
            <span class="text-slate-500">•</span>
            <span class="font-bold text-neon bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-[10px]">${m.time ? esc(m.time) + ' hs' : 'Horario a definir'}</span>
            ${m.date ? `<span class="text-slate-500">•</span><span class="text-slate-400 text-[10px]">${formatDate(m.date)}</span>` : ''}
          </div>
          <div class="space-y-1.5 mb-2.5">${side(m.pair1Id, w1)}${side(m.pair2Id, w2)}</div>
          <div class="flex items-center justify-between py-1 px-2.5 bg-slate-950/80 rounded-lg border border-slate-800 mb-2.5">
            <span class="text-[10px] text-slate-400 font-semibold">Marcador:</span>
            <div class="flex items-center gap-1">${score}</div>
          </div>
        </div>
        <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
          <span class="text-[9px] text-slate-500 font-mono">#${esc(m.id.slice(-5))}</span>
          <div class="flex items-center gap-1">${actions}</div>
        </div>
      </div>`;
  }).join('');
}

/* ---------- BUSCADOR "¿A QUÉ HORA JUEGO?" ---------- */
function searchPlayerMatches() {
  const input = $('playerSearchInput');
  const results = $('playerSearchResults');
  if (!input || !results) return;
  const term = input.value.toLowerCase().trim();

  if (term.length < 2) { results.innerHTML = ''; return; }

  const found = State.pairs.filter((p) => p.confirmada !== false &&
    (p.p1.toLowerCase().includes(term) || p.p2.toLowerCase().includes(term)));

  if (!found.length) {
    results.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center text-slate-400 text-xs">
        <i class="fa-solid fa-user-slash text-xl text-slate-600 mb-1 block"></i>
        No se encontró ningún jugador con "<strong>${esc(term)}</strong>".
      </div>`;
    return;
  }

  const ids = found.map((p) => p.id);
  const matches = State.matches
    .filter((m) => ids.includes(m.pair1Id) || ids.includes(m.pair2Id))
    .sort((a, b) => ((a.date || '9') + (a.time || '')).localeCompare((b.date || '9') + (b.time || '')));

  if (!matches.length) {
    results.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center text-slate-400 text-xs">
        <p class="font-bold text-white mb-0.5">${found.map((p) => esc(p.p1 + ' & ' + p.p2)).join(', ')}</p>
        <p class="text-[11px]">Anotados, pero aún sin partidos con horario en el fixture.</p>
      </div>`;
    return;
  }

  results.innerHTML = `
    <div class="text-[11px] text-neon font-bold mb-1">Partidos encontrados (${matches.length})</div>
    ${matches.map((m) => {
      const score = (m.sets && m.sets.length) ? m.sets.map((s) => `${s.p1}-${s.p2}`).join(' / ') : 'A disputarse';
      const st = m.status === 'En juego' ? 'bg-amber-500/20 text-amber-300' : m.status === 'Finalizado' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300';
      return `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div class="space-y-1">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[9px] font-black uppercase text-neon bg-neon/10 border border-neon/20 px-1.5 py-0.5 rounded">${esc(m.categoria)} - ${esc(ramaLabel(m.rama))}</span>
              <span class="text-[10px] text-slate-400">${esc(m.fase)}${m.grupo ? ' · ' + esc(m.grupo) : ''}</span>
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full ${st}">${esc(m.status)}</span>
            </div>
            <div class="text-xs sm:text-sm font-bold text-white pt-0.5">${pairHtml(m.pair1Id)} <span class="text-neon mx-1">VS</span> ${pairHtml(m.pair2Id)}</div>
            <div class="text-[11px] text-slate-400">Marcador: <span class="font-mono text-white font-bold">${esc(score)}</span></div>
          </div>
          <div class="bg-slate-950 p-2 sm:px-3 rounded-xl border border-slate-800/80 sm:text-right flex-shrink-0">
            <div class="text-[11px] font-bold text-neon"><i class="fa-solid fa-location-dot mr-1"></i> ${esc(m.court) || 'Cancha a definir'}</div>
            <div class="text-xs sm:text-sm font-black text-white mt-0.5"><i class="fa-regular fa-clock mr-1 text-neon"></i> ${m.time ? esc(m.time) + ' hs' : 'A definir'}</div>
            <div class="text-[10px] text-slate-400"><i class="fa-regular fa-calendar mr-1"></i> ${m.date ? formatDate(m.date) : 'Fecha a definir'}</div>
          </div>
        </div>`;
    }).join('')}`;
}

/* ---------- POSICIONES ---------- */
function renderStandings() {
  const container = $('standingsContainer');
  const ramaF = $('filterRama').value;
  const catF = $('filterCategoria').value;

  const groups = {};
  State.pairs.forEach((p) => {
    if (p.confirmada === false) return;
    if (ramaF !== 'ALL' && p.rama !== ramaF) return;
    if (catF !== 'ALL' && p.categoria !== catF) return;
    const zona = p.grupo || 'Sin zona';
    const k = `${p.rama}|${p.categoria}|${zona}`;
    if (!groups[k]) groups[k] = { rama: p.rama, categoria: p.categoria, grupo: zona, pairs: [] };
    groups[k].pairs.push(p);
  });

  const keys = Object.keys(groups).sort();
  if (!keys.length) {
    container.innerHTML = `
      <div class="py-12 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
        <i class="fa-solid fa-ranking-star text-3xl text-slate-600 mb-1.5 block"></i>
        <p class="text-slate-400 text-xs">No hay datos para armar la tabla con estos filtros.</p>
      </div>`;
    return;
  }

  container.innerHTML = keys.map((k) => {
    const grp = groups[k];
    const stats = calcTabla(grp.pairs, grp.rama, grp.categoria);
    const num = (v) => (v > 0 ? '+' + v : v);

    return `
      <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div class="bg-slate-950/90 px-3 py-2.5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-1.5">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-neon"></span>
            <h3 class="font-bold text-white text-xs sm:text-sm">${esc(grp.categoria)} - ${esc(ramaLabel(grp.rama))}</h3>
            <span class="text-[10px] bg-slate-800 text-neon font-semibold px-2 py-0.5 rounded-full border border-slate-700">${esc(grp.grupo)}</span>
          </div>
          <span class="text-[10px] text-slate-400 font-mono">${stats.length} parejas</span>
        </div>
        <div class="overflow-x-auto custom-scroll">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-950/50 text-slate-400 uppercase text-[9px] font-bold border-b border-slate-800/80">
              <tr>
                <th class="px-2 py-2 text-center w-8">#</th>
                <th class="px-3 py-2">Pareja</th>
                <th class="px-2 py-2 text-center font-black text-neon">PTS</th>
                <th class="px-2 py-2 text-center">PJ</th>
                <th class="px-2 py-2 text-center text-emerald-400">PG</th>
                <th class="px-2 py-2 text-center text-red-400">PP</th>
                <th class="px-2 py-2 text-center">SF-SC</th>
                <th class="px-2 py-2 text-center">DIF S</th>
                <th class="px-2 py-2 text-center">GF-GC</th>
                <th class="px-2 py-2 text-center font-bold">DIF G</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 text-slate-200">
              ${stats.map((st, i) => `
                <tr class="hover:bg-slate-800/40 transition ${i === 0 ? 'bg-neon/5' : i === 1 ? 'bg-emerald-500/5' : ''}">
                  <td class="px-2 py-2 text-center font-bold text-[11px]">${i === 0 ? '<span class="text-neon">1°</span>' : (i + 1) + '°'}</td>
                  <td class="px-3 py-2 font-bold text-white text-[11px]"><div class="truncate max-w-[150px] sm:max-w-none">${esc(st.pair.p1)} &amp; ${esc(st.pair.p2)}</div></td>
                  <td class="px-2 py-2 text-center font-black text-neon text-xs bg-slate-950/40">${st.pts}</td>
                  <td class="px-2 py-2 text-center font-mono text-[11px]">${st.pj}</td>
                  <td class="px-2 py-2 text-center font-mono text-[11px] text-emerald-400">${st.pg}</td>
                  <td class="px-2 py-2 text-center font-mono text-[11px] text-red-400">${st.pp}</td>
                  <td class="px-2 py-2 text-center font-mono text-[11px] text-slate-400">${st.sf}-${st.sc}</td>
                  <td class="px-2 py-2 text-center font-mono text-[11px] font-bold ${st.difSets > 0 ? 'text-neon' : st.difSets < 0 ? 'text-red-400' : 'text-slate-400'}">${num(st.difSets)}</td>
                  <td class="px-2 py-2 text-center font-mono text-[11px] text-slate-400">${st.gf}-${st.gc}</td>
                  <td class="px-2 py-2 text-center font-mono text-[11px] font-bold ${st.difGames > 0 ? 'text-neon' : st.difGames < 0 ? 'text-red-400' : 'text-slate-300'}">${num(st.difGames)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }).join('');
}

/* ---------- LLAVES ---------- */
function bracketMatchHtml(m) {
  const done = m.status === 'Finalizado' && m.winnerId;
  const w1 = done && m.winnerId === m.pair1Id;
  const w2 = done && m.winnerId === m.pair2Id;
  const sc = (n) => (m.sets && m.sets.length ? m.sets.map((s) => s['p' + n]).join(' ') : '');
  const clickable = isAdmin && m.pair1Id && m.pair2Id;
  const meta = m.status === 'En juego'
    ? '<span class="text-amber-300 font-bold">🔴 EN JUEGO</span>'
    : (m.time ? `${m.date ? formatDate(m.date) + ' · ' : ''}${esc(m.time)} hs${m.court ? ' · ' + esc(m.court) : ''}` : 'Horario a definir');

  return `
    <div class="bracket-match ${clickable ? 'clickable' : ''}" ${clickable ? `onclick="openResultModal('${m.id}')"` : ''}>
      <div class="bracket-team ${w1 ? 'win' : ''}"><span class="truncate">${pairHtml(m.pair1Id)}</span><span class="font-mono">${sc(1)}</span></div>
      <div class="bracket-team ${w2 ? 'win' : ''}"><span class="truncate">${pairHtml(m.pair2Id)}</span><span class="font-mono">${sc(2)}</span></div>
      <div class="bracket-meta">${meta}</div>
    </div>`;
}

function renderBrackets() {
  const container = $('bracketsContainer');
  const ramaF = $('filterRama').value;
  const catF = $('filterCategoria').value;

  const groups = {};
  State.matches.forEach((m) => {
    if (getRonda(m) === 0) return;
    if (ramaF !== 'ALL' && m.rama !== ramaF) return;
    if (catF !== 'ALL' && m.categoria !== catF) return;
    (groups[m.rama + '|' + m.categoria] = groups[m.rama + '|' + m.categoria] || []).push(m);
  });

  const keys = Object.keys(groups).sort();
  if (!keys.length) {
    container.innerHTML = `
      <div class="py-12 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
        <i class="fa-solid fa-sitemap text-3xl text-slate-600 mb-1.5 block"></i>
        <p class="text-slate-400 text-xs">Todavía no hay llaves sorteadas para estos filtros.</p>
      </div>`;
    return;
  }

  container.innerHTML = keys.map((k) => {
    const [rama, cat] = k.split('|');
    const rounds = [...new Set(groups[k].map(getRonda))].sort((a, b) => b - a);
    const cols = rounds.map((r) => {
      const ms = groups[k].filter((m) => getRonda(m) === r).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
      return `
        <div class="bracket-col">
          <div class="bracket-title">${esc(RONDA_NOMBRE[r] || 'Ronda de ' + r)}</div>
          ${ms.map(bracketMatchHtml).join('')}
        </div>`;
    }).join('');

    return `
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl">
        <div class="flex items-center gap-1.5 mb-3">
          <span class="w-2.5 h-2.5 rounded-full bg-neon"></span>
          <h3 class="font-bold text-white text-xs sm:text-sm">${esc(cat)} - ${esc(ramaLabel(rama))}</h3>
        </div>
        <div class="overflow-x-auto custom-scroll"><div class="bracket">${cols}</div></div>
      </div>`;
  }).join('');
}

/* ---------- COMPARTIR UN PARTIDO POR WHATSAPP ---------- */
function shareSingleMatchWhatsApp(id) {
  const m = State.matches.find((x) => x.id === id);
  if (!m) return;
  const score = (m.sets && m.sets.length) ? m.sets.map((s) => `${s.p1}-${s.p2}`).join(' / ') : 'Programado';
  const text = `🎾 *${State.config.nombre}*\n` +
    `🏆 *${m.categoria} (${ramaLabel(m.rama)})* - ${m.fase}\n` +
    `⚔️ *${pairNames(m.pair1Id) || 'Por definir'}* VS *${pairNames(m.pair2Id) || 'Por definir'}*\n` +
    `📍 ${m.court || 'Cancha a definir'}\n` +
    `🗓️ ${m.date ? formatDate(m.date) : 'Fecha a definir'} ${m.time ? 'a las ' + m.time + ' hs' : ''}\n` +
    `📊 Marcador: ${score}\n\n` +
    `Seguí todo en vivo: ${pageUrl('index.html')}`;
  window.open(waLink('', text), '_blank');
}

function toggleDropdown(id) {
  const menu = $(id);
  if (menu) menu.classList.toggle('hidden');
}
window.addEventListener('click', (e) => {
  if (!e.target.closest('#settingsMenu') && !e.target.closest('button[onclick*="settingsMenu"]')) {
    const menu = $('settingsMenu');
    if (menu && !menu.classList.contains('hidden')) menu.classList.add('hidden');
  }
});
