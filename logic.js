/* ==========================================================
   LÓGICA DEL TORNEO (solo lectura: posiciones y utilidades)
   ========================================================== */

// "ronda" = cantidad de parejas que juegan esa instancia (0 = fase de grupos)
const RONDA_NOMBRE = {
  32: 'Dieciseisavos de Final',
  16: 'Octavos de Final',
  8: 'Cuartos de Final',
  4: 'Semifinal',
  2: 'Final'
};

function rondaDeFase(fase) {
  if (fase === 'Fase de Grupos') return 0;
  for (const k in RONDA_NOMBRE) if (RONDA_NOMBRE[k] === fase) return Number(k);
  return 0;
}

function getRonda(m) {
  return typeof m.ronda === 'number' ? m.ronda : rondaDeFase(m.fase);
}

function pairById(id) {
  return State.pairs.find((p) => p.id === id) || null;
}

function pairNames(id) {
  const p = pairById(id);
  return p ? `${p.p1} / ${p.p2}` : null;
}

// Parejas confirmadas de una rama y categoría
function confirmedPairs(rama, cat) {
  return State.pairs.filter((p) => p.confirmada !== false && p.rama === rama && p.categoria === cat);
}

// { 'Zona A': [parejas], 'Zona B': [...] }
function getZonas(rama, cat) {
  const z = {};
  confirmedPairs(rama, cat).forEach((p) => {
    const k = p.grupo || 'Sin zona';
    (z[k] = z[k] || []).push(p);
  });
  return z;
}

// Tabla de posiciones de una zona (solo cuentan los partidos de fase de grupos)
// Victoria = 2 pts | Derrota = 1 pt | Desempate: Pts > Dif Sets > Dif Games
function calcTabla(pairs, rama, cat) {
  const stats = pairs.map((pair) => {
    let pj = 0, pg = 0, pp = 0, sf = 0, sc = 0, gf = 0, gc = 0, pts = 0;

    State.matches
      .filter((m) =>
        m.status === 'Finalizado' && m.rama === rama && m.categoria === cat &&
        getRonda(m) === 0 && (m.pair1Id === pair.id || m.pair2Id === pair.id))
      .forEach((m) => {
        pj++;
        const isP1 = m.pair1Id === pair.id;
        if (m.winnerId === pair.id) { pg++; pts += 2; } else { pp++; pts += 1; }

        (m.sets || []).forEach((s) => {
          const my = isP1 ? s.p1 : s.p2;
          const op = isP1 ? s.p2 : s.p1;
          gf += my || 0;
          gc += op || 0;
          if (my > op) sf++; else if (op > my) sc++;
        });
      });

    return { pair, pj, pg, pp, pts, sf, sc, difSets: sf - sc, gf, gc, difGames: gf - gc };
  });

  stats.sort((a, b) => b.pts - a.pts || b.difSets - a.difSets || b.difGames - a.difGames);
  return stats;
}
