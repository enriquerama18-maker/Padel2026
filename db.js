/* ==========================================================
   BASE DE DATOS
   - Con Firebase configurado: Firestore en TIEMPO REAL (todos los
     links se actualizan solos al cargar un resultado).
   - Sin Firebase: MODO DEMO con localStorage (para probar en tu PC).

   Colecciones:
     config/torneo   -> nombre, whatsappDueno, inscripcionAbierta
     parejas/{id}    -> p1, p2, rama, categoria, grupo, confirmada
     contactos/{id}  -> telefono   (privado: solo lo lee el dueño)
     partidos/{id}   -> partidos, resultados y llaves
   ========================================================== */

const DB = (() => {
  const useFb = APP_CONFIG.usaFirebase;
  const LKEY = 'padel_local_db_v2';
  let fdb = null, fauth = null;
  const subs = {};

  /* ---------------- MODO LOCAL (demo) ---------------- */
  const lread = () => { try { return JSON.parse(localStorage.getItem(LKEY)) || {}; } catch (e) { return {}; } };
  const lwrite = (d) => localStorage.setItem(LKEY, JSON.stringify(d));
  const llist = (col) => Object.entries(lread()[col] || {}).map(([id, v]) => ({ id, ...v }));
  const notify = (col) => (subs[col] || []).forEach((cb) => cb(llist(col)));
  const notifyAll = () => Object.keys(subs).forEach(notify);
  const rid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

  function seedLocal() {
    const d = { config: {}, parejas: {}, contactos: {}, partidos: {} };
    d.config.torneo = { nombre: 'Gran Torneo de Pádel', whatsappDueno: APP_CONFIG.whatsappDueno, inscripcionAbierta: true };
    const add = (p1, p2, rama, categoria, confirmada, tel) => {
      const id = rid();
      d.parejas[id] = { p1, p2, rama, categoria, grupo: '', confirmada, creada: Date.now() };
      d.contactos[id] = { telefono: tel };
    };
    [['Martín Benítez', 'Lucas Díaz'], ['Facundo Ruiz', 'Gustavo Rossi'], ['Diego Romero', 'Agustín Cabrera'],
     ['Rodrigo Sosa', 'Emiliano Godoy'], ['Nicolás Paz', 'Tomás Luna'], ['Joaquín Vera', 'Mateo Ríos']]
      .forEach((x, i) => add(x[0], x[1], 'Masculino', '6ta', true, '37041122' + (30 + i)));
    [['Florencia Giménez', 'Camila Ortiz'], ['Paula Vega', 'Daniela Morales'],
     ['Lucía Acosta', 'Sofía Duarte'], ['Marina Gómez', 'Julia Peralta']]
      .forEach((x, i) => add(x[0], x[1], 'Femenino', '7ma', true, '37046677' + (10 + i)));
    add('Carlos Núñez', 'Valeria Sosa', 'Mixto', '6ta', false, '3704556677');
    lwrite(d);
  }

  /* ---------------- API PÚBLICA ---------------- */
  return {
    modo: useFb ? 'firebase' : 'local',

    init() {
      if (useFb) {
        if (typeof firebase === 'undefined') { alert('No se pudo cargar Firebase. Revisá tu conexión.'); return; }
        firebase.initializeApp(APP_CONFIG.firebase);
        fdb = firebase.firestore();
        if (firebase.auth) fauth = firebase.auth();
      } else {
        if (!localStorage.getItem(LKEY)) seedLocal();
        window.addEventListener('storage', (e) => { if (e.key === LKEY) notifyAll(); });
      }
    },

    newId(col) { return useFb ? fdb.collection(col).doc().id : rid(); },

    // Escucha cambios en tiempo real. Devuelve función para cancelar.
    subscribe(col, cb, onError) {
      if (useFb) {
        return fdb.collection(col).onSnapshot(
          (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
          (err) => { console.error(col, err); if (onError) onError(err); }
        );
      }
      (subs[col] = subs[col] || []).push(cb);
      setTimeout(() => cb(llist(col)), 0);
      return () => { subs[col] = subs[col].filter((x) => x !== cb); };
    },

    async set(col, id, data) {
      if (useFb) return fdb.collection(col).doc(id).set(data, { merge: true });
      const d = lread(); d[col] = d[col] || {};
      d[col][id] = { ...(d[col][id] || {}), ...data };
      lwrite(d); notify(col);
    },

    async remove(col, id) {
      if (useFb) return fdb.collection(col).doc(id).delete();
      const d = lread(); if (d[col]) delete d[col][id];
      lwrite(d); notify(col);
    },

    // ops: [{type:'set'|'delete', col, id, data}]
    async batch(ops) {
      if (!ops.length) return;
      if (useFb) {
        for (let i = 0; i < ops.length; i += 400) {
          const b = fdb.batch();
          ops.slice(i, i + 400).forEach((o) => {
            const ref = fdb.collection(o.col).doc(o.id);
            if (o.type === 'delete') b.delete(ref); else b.set(ref, o.data, { merge: true });
          });
          await b.commit();
        }
        return;
      }
      const d = lread();
      ops.forEach((o) => {
        d[o.col] = d[o.col] || {};
        if (o.type === 'delete') delete d[o.col][o.id];
        else d[o.col][o.id] = { ...(d[o.col][o.id] || {}), ...o.data };
      });
      lwrite(d); notifyAll();
    },

    /* ---------------- AUTENTICACIÓN (solo admin.html) ---------------- */
    onAuth(cb) {
      if (useFb) return fauth.onAuthStateChanged((u) => cb(u ? { email: u.email } : null));
      cb(sessionStorage.getItem('padel_demo_admin') ? { email: 'demo' } : null);
      return () => {};
    },
    async login(email, pass) {
      if (useFb) { await fauth.signInWithEmailAndPassword(email, pass); return; }
      if (pass !== APP_CONFIG.demoPassword) { const e = new Error('Contraseña incorrecta'); e.code = 'auth/wrong-password'; throw e; }
      sessionStorage.setItem('padel_demo_admin', '1');
      location.reload();
    },
    async logout() {
      if (useFb) { await fauth.signOut(); return; }
      sessionStorage.removeItem('padel_demo_admin');
      location.reload();
    }
  };
})();
