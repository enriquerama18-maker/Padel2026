/* ==========================================================
   ESTRUCTURA VISUAL COMPARTIDA (misma que tu HTML original)
   buildShell(false) -> vista pública (jugadores)
   buildShell(true)  -> vista del organizador (admin.html)
   ========================================================== */

function buildShell(admin) {
  const tabs = [
    ['buscador', 'fa-magnifying-glass text-neon', '¿A qué hora juego?'],
    ['horarios', 'fa-calendar-days', 'Horarios & Fixture'],
    ['posiciones', 'fa-ranking-star text-amber-400', 'Posiciones'],
    ['llaves', 'fa-sitemap text-sky-400', 'Llaves']
  ];
  if (admin) {
    tabs.push(['sorteo', 'fa-dice text-neon', 'Sorteo']);
    tabs.push(['parejas', 'fa-users text-sky-400', 'Inscriptos']);
  }

  const tabsHtml = tabs.map(([id, icon, label]) => {
    const active = id === 'horarios';
    return `
      <button onclick="switchTab('${id}')" data-tab="${id}" class="tab-btn px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 flex-shrink-0 ${active ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}">
        <i class="fa-solid ${icon}"></i>
        <span>${label}</span>
        ${id === 'parejas' ? '<span id="pendingBadge" class="hidden bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 rounded-full">0</span>' : ''}
      </button>`;
  }).join('');

  const rightButtons = admin ? `
    <button onclick="openShareModal()" class="px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-neon hover:bg-neon/90 text-slate-950 font-black text-[11px] sm:text-xs flex items-center gap-1 shadow transition neon-glow">
      <i class="fa-solid fa-share-nodes text-[11px]"></i><span class="hidden xs:inline">Links</span>
    </button>
    <button onclick="logout()" class="px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] sm:text-xs font-bold text-slate-300 flex items-center gap-1 transition">
      <i class="fa-solid fa-right-from-bracket text-red-400 text-[11px]"></i><span>Salir</span>
    </button>
    <div class="relative">
      <button onclick="toggleDropdown('settingsMenu')" class="w-8 h-8 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center justify-center">
        <i class="fa-solid fa-ellipsis-vertical"></i>
      </button>
      <div id="settingsMenu" class="hidden absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 text-xs">
        <button onclick="openSettingsModal()" class="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-200 flex items-center gap-2">
          <i class="fa-solid fa-gear text-neon"></i> Ajustes del torneo
        </button>
        <button onclick="exportData()" class="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-200 flex items-center gap-2">
          <i class="fa-solid fa-file-arrow-down text-blue-400"></i> Descargar Respaldo (.json)
        </button>
        <label class="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-200 flex items-center gap-2 cursor-pointer">
          <i class="fa-solid fa-file-arrow-up text-emerald-400"></i> Restaurar Respaldo
          <input type="file" onchange="importData(event)" class="hidden" accept=".json">
        </label>
        <div class="border-t border-slate-800 my-1"></div>
        <button onclick="resetTournamentPrompt()" class="w-full text-left px-4 py-2 hover:bg-red-500/10 text-red-400 flex items-center gap-2">
          <i class="fa-solid fa-trash-can"></i> Reiniciar Torneo
        </button>
      </div>
    </div>` : `
    <a id="btnInscribirme" href="inscripcion.html" class="hidden px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-neon hover:bg-neon/90 text-slate-950 font-black text-[11px] sm:text-xs items-center gap-1 shadow transition neon-glow">
      <i class="fa-solid fa-user-plus text-[11px]"></i><span>Inscribirme</span>
    </a>`;

  const adminBar = admin ? `
    <div class="mb-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs flex-shrink-0">
          <i class="fa-solid fa-unlock-keyhole"></i>
        </div>
        <div>
          <h2 class="text-xs font-bold text-white">Modo Organizador Activado</h2>
          <p class="text-[10px] sm:text-[11px] text-slate-400">Cargá resultados, sorteá zonas y llaves. Todo se actualiza solo en el link de los jugadores.</p>
        </div>
      </div>
      <button onclick="copyText(pageUrl('index.html'),'Link público copiado')" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-neon border border-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition self-start sm:self-auto">
        <i class="fa-solid fa-copy"></i> Copiar Link Público
      </button>
    </div>` : '';

  const adminQuick = admin ? `
    <div class="flex items-center gap-1.5 pt-1 sm:pt-0 border-t border-slate-800/80 sm:border-0 justify-end">
      <button onclick="openPairModal()" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-[11px] font-bold transition flex items-center gap-1">
        <i class="fa-solid fa-user-plus text-emerald-400"></i> + Pareja
      </button>
      <button onclick="openMatchModal()" class="px-2.5 py-1.5 bg-neon hover:bg-neon/90 text-slate-950 rounded-xl text-[11px] font-black transition flex items-center gap-1 shadow neon-glow">
        <i class="fa-solid fa-plus"></i> Partido
      </button>
    </div>` : '';

  const adminSections = admin ? `
    <!-- TAB: SORTEO (solo admin) -->
    <section id="tab-sorteo" class="tab-content hidden space-y-3">
      <div>
        <h2 class="text-sm sm:text-base font-extrabold text-white">Sorteo por Categoría</h2>
        <p class="text-[10px] sm:text-xs text-slate-400">1) Sorteá las zonas → 2) cargá resultados → 3) generá la llave (octavos, cuartos, semifinal y final). También podés hacer eliminación directa.</p>
      </div>
      <div id="sorteoContainer" class="grid grid-cols-1 md:grid-cols-2 gap-3"></div>
    </section>

    <!-- TAB: INSCRIPTOS (solo admin) -->
    <section id="tab-parejas" class="tab-content hidden space-y-3">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 class="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
            <span>Listado de Parejas</span>
            <span id="pairsCountBadge" class="bg-slate-800 text-neon text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-700">0</span>
          </h2>
          <p class="text-[10px] sm:text-xs text-slate-400">Confirmá las inscripciones que llegan por el link y contactá por WhatsApp.</p>
        </div>
        <div class="flex items-center gap-1.5 w-full sm:w-auto">
          <input type="text" id="searchPairInput" oninput="renderPairs()" placeholder="Buscar pareja..." class="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-neon flex-1 sm:w-48">
          <button onclick="openPairModal()" class="px-2.5 py-1.5 bg-neon hover:bg-neon/90 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1">
            <i class="fa-solid fa-plus"></i> Inscribir
          </button>
        </div>
      </div>
      <div class="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/90 custom-scroll shadow-xl">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-950/80 text-slate-400 uppercase text-[9px] font-bold tracking-wider">
            <tr>
              <th class="px-3 py-2.5">Pareja</th>
              <th class="px-3 py-2.5">Categoría</th>
              <th class="px-3 py-2.5">Estado / Zona</th>
              <th class="px-3 py-2.5">WhatsApp</th>
              <th class="px-3 py-2.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody id="pairsTableBody" class="divide-y divide-slate-800/80 text-slate-200"></tbody>
        </table>
      </div>
    </section>` : '';

  $('app').innerHTML = `
  ${demoBannerHtml()}
  <!-- ================= TOP APP BAR ================= -->
  <header class="bg-[#0b1220]/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 w-full">
    <div class="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-2 sm:py-2.5">
      <div class="flex items-center justify-between gap-1.5 sm:gap-4 w-full">
        <div class="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1 sm:flex-initial cursor-pointer" onclick="switchTab('horarios')">
          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-neon flex items-center justify-center text-slate-950 font-black text-sm sm:text-lg shadow-md flex-shrink-0">
            <i class="fa-solid fa-table-tennis-paddle-ball"></i>
          </div>
          <div class="min-w-0 truncate">
            <h1 id="headerTournamentName" class="text-xs sm:text-base font-extrabold text-white uppercase tracking-tight truncate max-w-[130px] xs:max-w-[180px] sm:max-w-md">Torneo de Pádel</h1>
            <p id="roleBadgeHeader" class="text-[9px] sm:text-[11px] font-semibold ${admin ? 'text-neon' : 'text-slate-400'} truncate flex items-center gap-1">
              ${admin ? '<i class="fa-solid fa-shield-halved text-neon"></i> Organizador' : '<i class="fa-solid fa-globe text-slate-500"></i> Vista Pública · en vivo'}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-1 sm:gap-2 flex-shrink-0">${rightButtons}</div>
      </div>
      <nav class="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1.5 mt-1 custom-scroll border-t border-slate-800/60">${tabsHtml}</nav>
    </div>
  </header>

  <!-- ================= MAIN ================= -->
  <main class="flex-1 max-w-7xl mx-auto w-full px-2.5 sm:px-6 lg:px-8 py-3.5 sm:py-5">
    ${adminBar}

    <!-- FILTROS -->
    <div class="mb-4 sm:mb-6 bg-slate-900/90 border border-slate-800 p-2.5 sm:p-4 rounded-2xl shadow-lg space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
      <div class="grid grid-cols-2 xs:grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2">
        <div class="col-span-2 xs:col-span-1 sm:w-auto flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <i class="fa-solid fa-filter text-neon"></i> Filtros:
        </div>
        <select id="filterRama" onchange="applyGlobalFilters()" class="bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded-xl px-2 py-1.5 focus:outline-none focus:border-neon"></select>
        <select id="filterCategoria" onchange="applyGlobalFilters()" class="bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded-xl px-2 py-1.5 focus:outline-none focus:border-neon"></select>
        <select id="filterEstado" onchange="applyGlobalFilters()" class="col-span-2 xs:col-span-1 sm:w-auto bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded-xl px-2 py-1.5 focus:outline-none focus:border-neon">
          <option value="ALL">Todos los Estados</option>
          <option value="En juego">🔴 En juego ahora</option>
          <option value="Programado">⏳ Próximos</option>
          <option value="Finalizado">✅ Finalizados</option>
        </select>
      </div>
      ${adminQuick}
    </div>

    <!-- TAB: BUSCADOR -->
    <section id="tab-buscador" class="tab-content hidden space-y-4">
      <div class="bg-gradient-to-b from-slate-900 to-[#0e1626] border border-slate-800 p-4 sm:p-6 rounded-3xl text-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
        <div class="w-11 h-11 bg-neon/10 text-neon rounded-2xl flex items-center justify-center mx-auto mb-2 text-xl border border-neon/20">
          <i class="fa-solid fa-clock"></i>
        </div>
        <h2 class="text-base sm:text-xl font-black text-white">¿A qué hora juego?</h2>
        <p class="text-[11px] sm:text-xs text-slate-400 mt-1 max-w-sm mx-auto">Escribí tu nombre, apellido o el de tu compañero para ver cancha y horario al instante.</p>
        <div class="mt-4 relative max-w-md mx-auto">
          <input type="text" id="playerSearchInput" oninput="searchPlayerMatches()" placeholder="Buscar jugador (Ej: Lucas, Benítez...)" class="w-full bg-slate-950 border border-slate-700 focus:border-neon rounded-2xl px-3.5 py-2.5 pl-10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition">
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-500 text-sm"></i>
        </div>
      </div>
      <div id="playerSearchResults" class="max-w-3xl mx-auto space-y-2.5"></div>
    </section>

    <!-- TAB: HORARIOS -->
    <section id="tab-horarios" class="tab-content space-y-3 sm:space-y-4">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 sm:p-3">
          <span class="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Parejas</span>
          <p id="statTotalPairs" class="text-lg sm:text-xl font-black text-white mt-0.5">0</p>
        </div>
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 sm:p-3">
          <span class="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Partidos</span>
          <p id="statTotalMatches" class="text-lg sm:text-xl font-black text-white mt-0.5">0</p>
        </div>
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 sm:p-3 border-l-4 border-l-amber-500">
          <span class="text-[9px] sm:text-[10px] text-amber-400 font-bold uppercase tracking-wider block">En Cancha</span>
          <p id="statLiveMatches" class="text-lg sm:text-xl font-black text-amber-300 mt-0.5">0</p>
        </div>
        <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 sm:p-3 border-l-4 border-l-neon">
          <span class="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Finalizados</span>
          <p id="statFinishedMatches" class="text-lg sm:text-xl font-black text-neon mt-0.5">0</p>
        </div>
      </div>
      <div id="matchesContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"></div>
      <div id="noMatchesNotice" class="hidden py-12 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
        <i class="fa-solid fa-calendar-xmark text-3xl text-slate-600 mb-2 block"></i>
        <p class="text-slate-300 font-bold text-xs sm:text-sm">No hay partidos con estos filtros.</p>
        <p class="text-slate-500 text-[11px] mt-0.5">Cambiá el filtro de categoría o estado para ver más.</p>
      </div>
    </section>

    <!-- TAB: POSICIONES -->
    <section id="tab-posiciones" class="tab-content hidden space-y-4">
      <div class="flex items-center justify-between flex-wrap gap-1.5">
        <div>
          <h2 class="text-sm sm:text-base font-extrabold text-white">Tabla de Posiciones</h2>
          <p class="text-[10px] sm:text-xs text-slate-400">Victoria = 2 pts | Derrota = 1 pt · Clasifican los 2 primeros de cada zona</p>
        </div>
        <div class="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl">
          <i class="fa-solid fa-circle-info text-neon mr-1"></i> Desempate: Pts &gt; Dif Sets &gt; Dif Games
        </div>
      </div>
      <div id="standingsContainer" class="space-y-4"></div>
    </section>

    <!-- TAB: LLAVES -->
    <section id="tab-llaves" class="tab-content hidden space-y-4">
      <div>
        <h2 class="text-sm sm:text-base font-extrabold text-white">Llaves de Eliminación</h2>
        <p class="text-[10px] sm:text-xs text-slate-400">Octavos, cuartos, semifinal y final. El ganador avanza solo al cargar el resultado.</p>
      </div>
      <div id="bracketsContainer" class="space-y-5"></div>
    </section>

    ${adminSections}
  </main>`;
}
