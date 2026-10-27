/* ==========================================================
   PÁGINA PÚBLICA (index.html) - solo lectura, en tiempo real
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  isAdmin = false;
  buildShell(false);
  initFilters();
  DB.init();

  DB.subscribe('config', (list) => {
    const c = list.find((x) => x.id === 'torneo');
    if (c) State.config = { ...State.config, ...c };
    renderHeader();
  });
  DB.subscribe('parejas', (list) => { State.pairs = list; renderAll(); });
  DB.subscribe('partidos', (list) => { State.matches = list; renderAll(); });

  renderHeader();
  renderAll();
});
