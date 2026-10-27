/* ==========================================================
   SORTEOS (solo se carga en admin.html)
   - sortearZonas   : reparte parejas en zonas y crea todos contra todos
   - generarLlave   : toma los clasificados de las zonas y arma
                      octavos / cuartos / semifinal / final
   - sortearDirecta : eliminación directa al azar (sin zonas)
   - propagarGanador: cuando se carga un resultado, el ganador pasa
                      solo a la siguiente instancia
   ========================================================== */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Todos contra todos (método del círculo: evita que una pareja juegue seguido)
function roundRobin(list) {
  const arr = [...list];
  if (arr.length % 2) arr.push(null);
  const n = arr.length;
  const out = [];
  for (let r = 0; r < n - 1; r++) {
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i], b = arr[n - 1 - i];
      if (a && b) out.push([a, b]);
    }
    arr.splice(1, 0, arr.pop());
  }
  return out;
}

// Orden clásico de cabezas de serie: [1,8,4,5,2,7,3,6] para 8
function seedOrder(N) {
  let o = [1, 2];
  while (o.length < N) {
    const s = o.length * 2;
    o = o.flatMap((x) => [x, s + 1 - x]);
  }
  return o;
}

function partidoBase(rama, cat) {
  return {
    rama, categoria: cat, grupo: '', date: '', time: '', court: '',
    status: 'Programado', winnerId: null, sets: []
  };
}

// seeds: [{ pair, grupo }] ordenados del mejor al peor. Devuelve los partidos de la llave.
function armarLlave(rama, cat, seeds) {
  const q = seeds.length;
  let N = 2;
  while (N < q) N *= 2;

  const slots = seedOrder(N).map((s) => seeds[s - 1] || null);

  // Evitar que se crucen en la 1ra ronda dos parejas de la misma zona
  for (let i = 0; i < N; i += 2) {
    const a = slots[i], b = slots[i + 1];
    if (a && b && a.grupo && b.grupo && a.grupo === b.grupo) {
      for (let j = 0; j < N; j += 2) {
        if (j === i) continue;
        const a2 = slots[j], b2 = slots[j + 1];
        if (a2 && b2 && a.grupo !== b2.grupo && a2.grupo !== b.grupo) {
          slots[i + 1] = b2;
          slots[j + 1] = b;
          break;
        }
      }
    }
  }

  // Crear todas las instancias (de la primera hasta la final)
  const ids = {};
  for (let s = N; s >= 2; s /= 2) {
    ids[s] = Array.from({ length: s / 2 }, () => DB.newId('partidos'));
  }
  const docs = {};
  for (let s = N; s >= 2; s /= 2) {
    ids[s].forEach((id, k) => {
      docs[id] = {
        ...partidoBase(rama, cat),
        id,
        ronda: s,
        fase: RONDA_NOMBRE[s] || ('Ronda de ' + s),
        orden: k,
        pair1Id: null,
        pair2Id: null,
        next: s > 2 ? { id: ids[s / 2][Math.floor(k / 2)], slot: k % 2 === 0 ? 1 : 2 } : null
      };
    });
  }

  // Primera ronda: parejas reales. Si no hay rival ("libre"), pasa directo.
  ids[N].forEach((id, k) => {
    const a = slots[2 * k], b = slots[2 * k + 1];
    if (a && b) {
      docs[id].pair1Id = a.pair.id;
      docs[id].pair2Id = b.pair.id;
    } else {
      const libre = a || b;
      const nx = docs[id].next;
      delete docs[id];
      if (libre && nx) docs[nx.id][nx.slot === 1 ? 'pair1Id' : 'pair2Id'] = libre.pair.id;
    }
  });

  return Object.values(docs);
}

/* ---------------- 1) SORTEO DE ZONAS ---------------- */
async function sortearZonas(rama, cat, size) {
  const pairs = confirmedPairs(rama, cat);
  if (pairs.length < 3) return { ok: false, msg: 'Se necesitan al menos 3 parejas confirmadas para armar zonas.' };

  const g = Math.max(1, Math.round(pairs.length / size));
  const zonas = Array.from({ length: g }, () => []);
  shuffle(pairs).forEach((p, i) => zonas[i % g].push(p));

  const ops = [];
  State.matches
    .filter((m) => m.rama === rama && m.categoria === cat)
    .forEach((m) => ops.push({ type: 'delete', col: 'partidos', id: m.id }));

  zonas.forEach((z, zi) => {
    const nombre = g === 1 ? 'Zona Única' : 'Zona ' + String.fromCharCode(65 + zi);
    z.forEach((p) => ops.push({ type: 'set', col: 'parejas', id: p.id, data: { grupo: nombre } }));
    roundRobin(z).forEach(([a, b], k) => {
      const id = DB.newId('partidos');
      ops.push({
        type: 'set', col: 'partidos', id,
        data: {
          ...partidoBase(rama, cat), id, grupo: nombre,
          fase: 'Fase de Grupos', ronda: 0, orden: k,
          pair1Id: a.id, pair2Id: b.id, next: null
        }
      });
    });
  });

  await DB.batch(ops);
  return { ok: true, msg: `Sorteo hecho: ${g} zona(s) y ${ops.filter((o) => o.col === 'partidos' && o.type === 'set').length} partidos.` };
}

/* ---------------- 2) LLAVE DESDE LAS ZONAS ---------------- */
async function generarLlave(rama, cat) {
  const zonas = getZonas(rama, cat);
  const nombres = Object.keys(zonas).filter((n) => n !== 'Sin zona').sort();
  if (!nombres.length) return { ok: false, msg: 'Primero hacé el sorteo de zonas.' };

  let seeds;
  if (nombres.length === 1) {
    const t = calcTabla(zonas[nombres[0]], rama, cat);
    const k = t.length >= 4 ? 4 : 2;
    seeds = t.slice(0, k).map((s) => ({ pair: s.pair, grupo: null }));
  } else {
    const w = [], r = [];
    nombres.forEach((n) => {
      const t = calcTabla(zonas[n], rama, cat);
      if (t[0]) w.push({ ...t[0], grupo: n });
      if (t[1]) r.push({ ...t[1], grupo: n });
    });
    const ord = (a, b) => b.pts - a.pts || b.difSets - a.difSets || b.difGames - a.difGames;
    w.sort(ord);
    r.sort(ord);
    seeds = [...w, ...r].map((s) => ({ pair: s.pair, grupo: s.grupo }));
  }
  if (seeds.length < 2) return { ok: false, msg: 'No hay suficientes clasificados.' };

  const ops = [];
  State.matches
    .filter((m) => m.rama === rama && m.categoria === cat && getRonda(m) > 0)
    .forEach((m) => ops.push({ type: 'delete', col: 'partidos', id: m.id }));
  const docs = armarLlave(rama, cat, seeds);
  docs.forEach((d) => ops.push({ type: 'set', col: 'partidos', id: d.id, data: d }));

  await DB.batch(ops);
  const primera = Math.max(...docs.map((d) => d.ronda));
  return { ok: true, msg: `Llave generada desde ${RONDA_NOMBRE[primera] || 'la primera ronda'} hasta la Final.` };
}

/* ---------------- 3) ELIMINACIÓN DIRECTA AL AZAR ---------------- */
async function sortearDirecta(rama, cat) {
  const pairs = shuffle(confirmedPairs(rama, cat));
  if (pairs.length < 2) return { ok: false, msg: 'Se necesitan al menos 2 parejas confirmadas.' };

  const ops = [];
  State.matches
    .filter((m) => m.rama === rama && m.categoria === cat)
    .forEach((m) => ops.push({ type: 'delete', col: 'partidos', id: m.id }));
  pairs.forEach((p) => ops.push({ type: 'set', col: 'parejas', id: p.id, data: { grupo: '' } }));

  const docs = armarLlave(rama, cat, pairs.map((p) => ({ pair: p, grupo: null })));
  docs.forEach((d) => ops.push({ type: 'set', col: 'partidos', id: d.id, data: d }));

  await DB.batch(ops);
  const primera = Math.max(...docs.map((d) => d.ronda));
  return { ok: true, msg: `Sorteo directo listo: arranca en ${RONDA_NOMBRE[primera] || 'primera ronda'}.` };
}

/* ---------------- BORRAR SORTEO ---------------- */
async function borrarSorteo(rama, cat) {
  const ops = [];
  State.matches
    .filter((m) => m.rama === rama && m.categoria === cat)
    .forEach((m) => ops.push({ type: 'delete', col: 'partidos', id: m.id }));
  confirmedPairs(rama, cat).forEach((p) => ops.push({ type: 'set', col: 'parejas', id: p.id, data: { grupo: '' } }));
  await DB.batch(ops);
}

/* ---------------- AVANCE AUTOMÁTICO DEL GANADOR ---------------- */
async function propagarGanador(m) {
  if (!m || !m.next) return;
  const valor = (m.status === 'Finalizado' && m.winnerId) ? m.winnerId : null;
  const campo = m.next.slot === 1 ? 'pair1Id' : 'pair2Id';
  await DB.set('partidos', m.next.id, { [campo]: valor });
}
