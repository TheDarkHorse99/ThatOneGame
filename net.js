// Room storage and live sync.
// Two back ends with the same interface:
//   online  - Firebase Realtime Database (used when firebase-config.js is filled in)
//   local   - this browser's storage (practice mode: rooms work between tabs of one browser)
//
// A room has one PUBLIC document everyone can read (table, life, discard piles, log)
// and one PRIVATE document per player (hand, deck order, identity of face-down cards).
// Each player also keeps a SPECTATE copy of their hand and face-down cards, which only
// people who are not seated in the room can read. Decks are never copied there.

import { firebaseConfig } from './firebase-config.js';

const FIREBASE_VERSION = '13.2.0';
const asArray = (x) => (Array.isArray(x) ? x.filter((v) => v != null) : x && typeof x === 'object' ? Object.values(x) : []);

// The database drops empty lists, so fill them back in after every read.
export function normPublic(s) {
  if (!s) return s;
  s.seats = s.seats || {};
  s.pl = s.pl || {};
  s.inbox = s.inbox || {};
  s.log = asArray(s.log);
  for (const p of ['p1', 'p2']) {
    const d = (s.pl[p] = s.pl[p] || { life: 30, hand: 0, deck: 0, plays: 0 });
    d.field = asArray(d.field).map((c) => ({ ...c, m: c.m || {}, add: c.add || '', tags: asArray(c.tags), soul: asArray(c.soul) }));
    d.discard = asArray(d.discard);
    d.removed = asArray(d.removed);
    s.inbox[p] = asArray(s.inbox[p]);
  }
  s.combat = s.combat || null;
  return s;
}
export function normPrivate(v) {
  v = v || {};
  return { hand: asArray(v.hand), deck: asArray(v.deck), hidden: v.hidden || {} };
}
const clean = (v) => JSON.parse(JSON.stringify(v)); // strips undefined, which the database rejects

function localNet() {
  let uid = sessionStorage.getItem('tog:uid');
  if (!uid) {
    uid = 'u' + Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem('tog:uid', uid);
  }
  const subs = {};
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
  const fire = (k) => (subs[k] || []).forEach((cb) => cb(read(k)));
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel('tog') : null;
  if (bc) bc.onmessage = (e) => fire(e.data);
  window.addEventListener('storage', (e) => e.key && fire(e.key));
  const write = (k, v) => { localStorage.setItem(k, JSON.stringify(clean(v))); fire(k); if (bc) bc.postMessage(k); };
  const watch = (k, cb) => { (subs[k] = subs[k] || new Set()).add(cb); cb(read(k)); return () => subs[k].delete(cb); };
  const pub = (c) => `tog:room:${c}:pub`;
  const priv = (c) => `tog:room:${c}:priv:${uid}`;
  const spec = (c, u) => `tog:room:${c}:spec:${u}`;
  return {
    mode: 'local', uid,
    setSpectate: async (c, v) => write(spec(c, uid), v),
    watchSpectate: (c, u, cb) => watch(spec(c, u), cb),
    getPublic: async (c) => read(pub(c)),
    setPublic: async (c, v) => write(pub(c), v),
    txPublic: async (c, fn) => {
      const cur = read(pub(c));
      if (cur == null) return false;
      const s = normPublic(cur);
      if (fn(s) === false) return false;
      write(pub(c), s);
      return true;
    },
    watchPublic: (c, cb) => watch(pub(c), cb),
    getPrivate: async (c) => read(priv(c)),
    setPrivate: async (c, v) => write(priv(c), v),
  };
}

async function firebaseNet() {
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/`;
  const [{ initializeApp }, { getAuth, signInAnonymously }, db] = await Promise.all([
    import(base + 'firebase-app.js'),
    import(base + 'firebase-auth.js'),
    import(base + 'firebase-database.js'),
  ]);
  const app = initializeApp(firebaseConfig);
  const { user } = await signInAnonymously(getAuth(app));
  const uid = user.uid;
  const database = db.getDatabase(app);
  const pub = (c) => db.ref(database, `rooms/${c}/public`);
  const priv = (c) => db.ref(database, `rooms/${c}/private/${uid}`);
  const spec = (c, u) => db.ref(database, `rooms/${c}/spectate/${u}`);
  return {
    mode: 'online', uid,
    setSpectate: (c, v) => db.set(spec(c, uid), clean(v)),
    watchSpectate: (c, u, cb) => db.onValue(spec(c, u), (snap) => cb(snap.val()), () => cb(null)),
    getPublic: async (c) => (await db.get(pub(c))).val(),
    setPublic: (c, v) => db.set(pub(c), clean(v)),
    txPublic: async (c, fn) => {
      const res = await db.runTransaction(pub(c), (cur) => {
        if (cur === null) return null; // not loaded yet; the database retries with the real value
        const s = normPublic(cur);
        if (fn(s) === false) return undefined; // abort
        return clean(s);
      });
      return res.committed;
    },
    watchPublic: (c, cb) => db.onValue(pub(c), (snap) => cb(snap.val())),
    getPrivate: async (c) => (await db.get(priv(c))).val(),
    setPrivate: (c, v) => db.set(priv(c), clean(v)),
  };
}

export async function connect() {
  if (firebaseConfig && firebaseConfig.apiKey) {
    try {
      return await firebaseNet();
    } catch (err) {
      console.error('Firebase failed to start, falling back to practice mode', err);
      const net = localNet();
      net.error = String(err && err.message ? err.message : err);
      return net;
    }
  }
  return localNet();
}
