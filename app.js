// That One Game - online tabletop.
// Sections: helpers, card rendering, modal, library, decks, home, room (table, actions, combat).

import { CARDS, CARD_BY_ID, SETS, STARTERS } from './cards.js';
import { connect, normPublic, normPrivate } from './net.js';

// ---------------------------------------------------------------- helpers
const COLS = ['r', 'y', 'g', 'b'];
const COL_NAMES = ['Red', 'Yellow', 'Green', 'Blue'];
const TYPES = ['unit', 'location', 'event', 'object'];
const TAGS = ['Condemned', 'Poisoned', 'Guard Duty'];
const DECK_SIZE = 40;
const MAX_COPIES = 3;
const $app = document.getElementById('app');
let net = null;

function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'class') e.className = v;
    else if (k === 'value') e.value = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return e;
}
const load = (k, fallback) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fallback : v; } catch { return fallback; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };
const newId = (prefix = 'x') => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const opp = (p) => (p === 'p1' ? 'p2' : 'p1');
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function toast(msg) {
  const t = h('div', { class: 'toast' }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), 2600);
}
const btn = (label, onclick, cls = '') => h('button', { class: 'btn ' + cls, onclick }, label);

// ---------------------------------------------------------------- cards
// Current stats of a card on the table: printed stat + changes. null = the card does not have that color.
function statsOf(inst) {
  const card = inst && inst.c ? CARD_BY_ID[inst.c] : null;
  const base = card && card.stats ? card.stats : [null, null, null, null];
  return COLS.map((col, i) => {
    const has = base[i] != null || (inst.add || '').includes(col);
    return has ? (base[i] || 0) + ((inst.m && inst.m[col]) || 0) : null;
  });
}
function statChips(values) {
  if (!values || values.every((v) => v == null)) return null;
  return h('div', { class: 'stats' }, values.map((v, i) => (v == null ? null : h('span', { class: 'stat s-' + COLS[i], title: COL_NAMES[i] }, v))));
}
// Small card face. opts: inst (table copy), count (deck builder badge), onclick
function cardView(card, opts = {}) {
  const inst = opts.inst;
  if (!card) {
    return h('button', { class: 'card back' + (inst && inst.r ? ' rested' : ''), onclick: opts.onclick, 'data-iid': inst && inst.i },
      h('div', { class: 'card-name' }, 'Hidden'), inst && inst.r ? h('div', { class: 'flag' }, 'rested') : null);
  }
  const values = inst ? statsOf(inst) : card.stats;
  const cls = ['card', 't-' + card.type, inst && inst.r ? 'rested' : '', inst && inst.h ? 'facedown' : '', opts.dim ? 'dim' : ''].join(' ');
  return h('button', { class: cls, onclick: opts.onclick, onmouseenter: () => showPreview(card, inst), 'data-card': card.id, 'data-iid': inst && inst.i },
    h('div', { class: 'card-top' }, h('span', { class: 'card-name' }, card.name), h('span', { class: 'lv' }, 'Lv' + card.level)),
    h('div', { class: 'card-type' }, card.type + (card.traits ? ' · ' + card.traits : '')),
    statChips(values),
    opts.text === false ? null : h('div', { class: 'card-text' }, card.effect),
    inst && inst.h ? h('div', { class: 'flag' }, 'hidden') : null,
    inst && inst.r ? h('div', { class: 'flag' }, 'rested') : null,
    inst && inst.tags.length ? h('div', { class: 'tags' }, inst.tags.map((t) => h('span', { class: 'tag' }, t))) : null,
    inst && inst.soul && inst.soul.length ? h('div', { class: 'flag soul' }, 'soul ' + inst.soul.length) : null,
    inst && inst.note ? h('div', { class: 'note' }, inst.note) : null,
    opts.count ? h('span', { class: 'count' }, '×' + opts.count) : null);
}
function cardDetail(card, inst) {
  return h('div', { class: 'detail t-' + card.type },
    h('div', { class: 'detail-head' }, h('strong', {}, card.name), h('span', { class: 'lv' }, 'Level ' + card.level)),
    h('div', { class: 'card-type' }, card.type + (card.traits ? ' · ' + card.traits : '') + ' · ' + card.set),
    statChips(inst ? statsOf(inst) : card.stats),
    card.effect ? h('p', { class: 'detail-text' }, card.effect) : h('p', { class: 'detail-text muted' }, 'No effect.'));
}

// Desktop: hovering a card shows its full text in the side panel of a room.
let preview = null;
function previewBody() {
  if (!preview) return h('p', { class: 'muted' }, 'Hover over a card to read it here.');
  return cardDetail(preview.card, preview.inst && preview.inst.c ? preview.inst : null);
}
function showPreview(card, inst) {
  preview = { card, inst };
  const el = document.querySelector('.preview');
  if (el) el.replaceChildren(previewBody());
}

// ---------------------------------------------------------------- modal
let modalFn = null;
let modalOnClose = null;
function openModal(fn, onClose) { modalFn = fn; modalOnClose = onClose || null; renderModal(); }
function closeModal() {
  const done = modalOnClose;
  modalFn = null; modalOnClose = null;
  renderModal();
  if (done) done();
}
function renderModal() {
  document.querySelector('.overlay')?.remove();
  if (!modalFn) return;
  const body = modalFn();
  if (!body) { closeModal(); return; }
  const overlay = h('div', { class: 'overlay', onclick: (e) => { if (e.target === overlay) closeModal(); } },
    h('div', { class: 'sheet' }, h('button', { class: 'close', onclick: closeModal, 'aria-label': 'Close' }, '×'), body));
  document.body.append(overlay);
}

// ---------------------------------------------------------------- card filters (library + deck builder)
function matches(card, f) {
  if (f.type && card.type !== f.type) return false;
  if (f.level && card.level !== Number(f.level)) return false;
  if (f.set && card.set !== f.set) return false;
  if (f.q) {
    const q = f.q.toLowerCase();
    if (!(card.name + ' ' + card.traits + ' ' + card.effect).toLowerCase().includes(q)) return false;
  }
  return true;
}
function filterBar(f, onChange) {
  const sel = (key, label, options) => h('select', { 'aria-label': label, onchange: (e) => { f[key] = e.target.value; onChange(); } },
    h('option', { value: '' }, label), options.map((o) => h('option', { value: o, selected: String(f[key]) === String(o) }, key === 'level' ? 'Level ' + o : o)));
  return h('div', { class: 'filters' },
    h('input', { type: 'search', placeholder: 'Search name, trait or text', value: f.q || '', oninput: (e) => { f.q = e.target.value; onChange(true); } }),
    sel('type', 'All types', TYPES), sel('level', 'All levels', [1, 2, 3]), sel('set', 'All sets', SETS));
}

// ---------------------------------------------------------------- library
const libFilter = { q: '', type: '', level: '', set: '' };
function viewLibrary() {
  const grid = h('div', { class: 'grid' });
  const count = h('p', { class: 'muted' });
  const fill = () => {
    const list = CARDS.filter((c) => matches(c, libFilter));
    count.textContent = `${list.length} of ${CARDS.length} cards`;
    grid.replaceChildren(...list.map((c) => cardView(c, { onclick: () => openModal(() => cardDetail(c)) })));
  };
  fill();
  return h('main', {}, h('h1', {}, 'Card library'), filterBar(libFilter, fill), count, grid);
}

// ---------------------------------------------------------------- decks
const myDecks = () => load('tog:decks', []);
const saveDecks = (d) => save('tog:decks', d);
const allDecks = () => [...myDecks(), ...STARTERS];
const deckSize = (d) => Object.values(d.cards).reduce((a, b) => a + b, 0);
function deckProblems(d) {
  const out = [];
  const n = deckSize(d);
  if (n !== DECK_SIZE) out.push(`${n} of ${DECK_SIZE} cards`);
  for (const [id, c] of Object.entries(d.cards)) {
    if (!CARD_BY_ID[id]) out.push(`unknown card "${id}"`);
    else if (c > MAX_COPIES) out.push(`more than ${MAX_COPIES} ${CARD_BY_ID[id].name}`);
  }
  return out;
}
const deckCode = (d) => btoa(unescape(encodeURIComponent(JSON.stringify({ n: d.name, c: d.cards }))));
function importDeck(code) {
  const o = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
  if (!o || typeof o.c !== 'object') throw new Error('bad code');
  const cards = {};
  for (const [id, n] of Object.entries(o.c)) if (CARD_BY_ID[id] && n > 0) cards[id] = Math.min(Number(n) || 0, 99);
  return { id: newId('deck'), name: String(o.n || 'Imported deck').slice(0, 40), cards };
}
function viewDecks() {
  const row = (d) => {
    const problems = deckProblems(d);
    return h('div', { class: 'row' },
      h('div', {}, h('strong', {}, d.name), h('div', { class: problems.length ? 'warn' : 'muted' }, problems.length ? problems.join(', ') : 'Ready to play')),
      h('div', { class: 'row-actions' },
        d.starter ? null : btn('Edit', () => { location.hash = '#/decks/' + d.id; }),
        btn('Copy', () => { const copy = { id: newId('deck'), name: d.name.replace(' (starter)', '') + ' copy', cards: { ...d.cards } }; saveDecks([copy, ...myDecks()]); location.hash = '#/decks/' + copy.id; }),
        btn('Share code', () => { navigator.clipboard?.writeText(deckCode(d)).then(() => toast('Deck code copied'), () => prompt('Copy this deck code', deckCode(d))); }),
        d.starter ? null : btn('Delete', () => { if (confirm(`Delete "${d.name}"?`)) { saveDecks(myDecks().filter((x) => x.id !== d.id)); render(); } }, 'danger')));
  };
  return h('main', {}, h('h1', {}, 'Decks'),
    h('div', { class: 'bar' },
      btn('New deck', () => { const d = { id: newId('deck'), name: 'New deck', cards: {} }; saveDecks([d, ...myDecks()]); location.hash = '#/decks/' + d.id; }, 'primary'),
      btn('Import code', () => { const code = prompt('Paste a deck code'); if (!code) return; try { saveDecks([importDeck(code), ...myDecks()]); render(); } catch { toast('That deck code did not work'); } })),
    h('p', { class: 'muted' }, 'Decks are saved in this browser. Use a deck code to move one to another device or share it.'),
    h('h2', {}, 'Your decks'), myDecks().length ? myDecks().map(row) : h('p', { class: 'muted' }, 'No decks yet.'),
    h('h2', {}, 'Starter decks'), STARTERS.map(row));
}
const deckFilter = { q: '', type: '', level: '', set: '' };
function viewDeckEdit(id) {
  const decks = myDecks();
  const deck = decks.find((d) => d.id === id);
  if (!deck) return h('main', {}, h('p', {}, 'Deck not found.'), h('a', { href: '#/decks' }, 'Back to decks'));
  const persist = () => saveDecks(decks);
  const pool = h('div', { class: 'grid' });
  const side = h('div', { class: 'decklist' });
  const change = (cid, delta) => {
    const n = Math.max(0, Math.min(MAX_COPIES, (deck.cards[cid] || 0) + delta));
    if (n) deck.cards[cid] = n; else delete deck.cards[cid];
    persist(); fill();
  };
  const fill = () => {
    pool.replaceChildren(...CARDS.filter((c) => matches(c, deckFilter)).map((c) => cardView(c, { count: deck.cards[c.id], dim: (deck.cards[c.id] || 0) >= MAX_COPIES, onclick: () => change(c.id, 1) })));
    const entries = Object.entries(deck.cards).map(([cid, n]) => [CARD_BY_ID[cid], n]).filter(([c]) => c).sort((a, b) => a[0].level - b[0].level || a[0].name.localeCompare(b[0].name));
    const n = deckSize(deck);
    const byLevel = [1, 2, 3].map((lv) => entries.filter(([c]) => c.level === lv).reduce((a, [, k]) => a + k, 0));
    side.replaceChildren(
      h('div', { class: 'deck-total ' + (n === DECK_SIZE ? 'ok' : 'warn') }, `${n} / ${DECK_SIZE} cards`),
      h('div', { class: 'muted' }, `Level 1: ${byLevel[0]} · Level 2: ${byLevel[1]} · Level 3: ${byLevel[2]}`),
      entries.length ? null : h('p', { class: 'muted' }, 'Tap cards to add them. Up to 3 copies of each.'),
      entries.map(([c, k]) => h('div', { class: 'deck-line t-' + c.type },
        h('button', { class: 'linkish', onclick: () => openModal(() => cardDetail(c)) }, `${k}× ${c.name}`), h('span', { class: 'lv' }, 'Lv' + c.level),
        h('span', { class: 'row-actions' }, btn('−', () => change(c.id, -1), 'tiny'), btn('+', () => change(c.id, 1), 'tiny')))));
  };
  fill();
  return h('main', {},
    h('div', { class: 'bar' }, h('a', { href: '#/decks' }, '← Decks'),
      h('input', { class: 'deck-name', 'aria-label': 'Deck name', value: deck.name, maxlength: 40, oninput: (e) => { deck.name = e.target.value; persist(); } })),
    h('div', { class: 'builder' }, h('section', {}, filterBar(deckFilter, fill), pool), h('aside', {}, side)));
}

// ---------------------------------------------------------------- home
function playerSetup() {
  const decks = allDecks();
  const lastDeck = load('tog:lastDeck', '');
  const name = h('input', { id: 'pname', placeholder: 'Your name', maxlength: 20, value: load('tog:name', ''), oninput: (e) => save('tog:name', e.target.value) });
  const deck = h('select', { id: 'pdeck', 'aria-label': 'Deck', onchange: (e) => save('tog:lastDeck', e.target.value) },
    decks.map((d) => { const bad = deckProblems(d).length > 0; return h('option', { value: d.id, disabled: bad, selected: d.id === lastDeck }, d.name + (bad ? ' (not ready)' : '')); }));
  const read = () => {
    const d = decks.find((x) => x.id === deck.value);
    if (!d || deckProblems(d).length) { toast('Pick a deck with exactly 40 cards'); return null; }
    return { name: (name.value || 'Player').trim().slice(0, 20) || 'Player', deck: d };
  };
  return { el: h('div', { class: 'setup' }, h('label', {}, 'Name', name), h('label', {}, 'Deck', deck)), read };
}
function modeNote() {
  if (!net) return null;
  if (net.mode === 'online') return null;
  return h('p', { class: 'notice' }, net.error ? `Online rooms failed to start (${net.error}). ` : '', 'Practice mode: rooms only work between tabs of this browser until online play is set up.');
}
function viewHome() {
  const setup = playerSetup();
  const code = h('input', { placeholder: 'Room code', maxlength: 6, 'aria-label': 'Room code', oninput: (e) => { e.target.value = e.target.value.toUpperCase(); } });
  return h('main', { class: 'home' },
    h('h1', {}, 'That One Game'), h('p', { class: 'muted' }, 'Work-in-progress title. Play online, build decks, browse every card.'), modeNote(),
    h('section', { class: 'panel' }, h('h2', {}, 'Play'), setup.el,
      h('div', { class: 'bar' }, btn('Create room', async () => { const p = setup.read(); if (p) await createRoom(p); }, 'primary')),
      h('div', { class: 'bar' }, code, btn('Join room', () => { if (code.value.trim()) location.hash = '#/room/' + code.value.trim().toUpperCase(); })),
      h('p', { class: 'muted' }, 'Joining a full room puts you in as a spectator.')),
    h('section', { class: 'panel links' }, h('a', { class: 'btn', href: '#/library' }, 'Card library'), h('a', { class: 'btn', href: '#/decks' }, 'Deck builder')));
}

// ---------------------------------------------------------------- room state
const R = { code: null, pub: null, priv: null, me: null, stop: null, working: false, watching: false, missing: false, spec: {}, specUid: {}, specStop: {} };
const mine = () => R.pub.pl[R.me];
const seatName = (p) => (R.pub.seats[p] ? R.pub.seats[p].name : 'Waiting for player');
// Saving my private cards also refreshes the copy spectators read (hand and face-down cards, never the deck).
const savePriv = () => Promise.all([net.setPrivate(R.code, R.priv), net.setSpectate(R.code, { hand: R.priv.hand, hidden: R.priv.hidden })]);
// A spectator is anyone in the room who is not one of the two players.
const spectating = () => !R.me && R.pub && (R.watching || (R.pub.seats.p1 && R.pub.seats.p2));
// What a face-down card really is, if this viewer is allowed to know (its owner, or a spectator).
function secretOf(inst) {
  if (inst.c) return null;
  if (inst.o === R.me && R.priv) return R.priv.hidden[inst.i] || null;
  if (spectating() && R.spec[inst.o]) return R.spec[inst.o].hidden[inst.i] || null;
  return null;
}
function watchSpectatorViews() {
  for (const p of ['p1', 'p2']) {
    const uid = !R.me && R.pub.seats[p] ? R.pub.seats[p].uid : null;
    if (R.specUid[p] === uid) continue;
    if (R.specStop[p]) R.specStop[p]();
    R.specUid[p] = uid; R.specStop[p] = null; R.spec[p] = null;
    if (!uid) continue;
    const code = R.code;
    R.specStop[p] = net.watchSpectate(code, uid, (v) => {
      if (R.code !== code) return;
      R.spec[p] = v ? normPrivate(v) : null;
      if (location.hash.startsWith('#/room/')) render();
    });
  }
}
function addLog(s, m, c) {
  const entry = { w: R.me && s.seats[R.me] ? s.seats[R.me].name : '', m };
  if (c) entry.c = c;
  s.log.push(entry);
  if (s.log.length > 60) s.log = s.log.slice(-60);
}
function afterChange(s) {
  const low = Math.min(s.pl.p1.life, s.pl.p2.life);
  if (low <= 20 && s.lv < 2) { s.lv = 2; s.log.push({ w: '', m: 'Level 2 is now unlocked for both players.' }); }
  if (low <= 10 && s.lv < 3) { s.lv = 3; s.log.push({ w: '', m: 'Level 3 is now unlocked for both players.' }); }
}
// One change to the shared table. fn edits the state; return false to cancel.
async function tx(fn, msg, card) {
  try {
    return await net.txPublic(R.code, (s) => {
      if (fn(s) === false) return false;
      if (R.me && R.priv) { s.pl[R.me].hand = R.priv.hand.length; s.pl[R.me].deck = R.priv.deck.length; }
      afterChange(s);
      if (msg) addLog(s, msg, card);
    });
  } catch (err) {
    console.error(err);
    toast('That change did not save. Check your connection.');
    return false;
  }
}
function findInst(s, iid) {
  for (const p of ['p1', 'p2']) {
    const idx = s.pl[p].field.findIndex((x) => x.i === iid);
    if (idx >= 0) return { inst: s.pl[p].field[idx], ctrl: p, idx };
  }
  return null;
}
// Take a card off the table. Private destinations (hand, deck) go through the owner's inbox.
function leave(s, iid, dest, knownCid) {
  const g = findInst(s, iid);
  if (!g) return;
  const inst = g.inst;
  s.pl[g.ctrl].field.splice(g.idx, 1);
  for (const entry of inst.soul || []) { const [owner, soulCid] = entry.split('|'); s.pl[owner].discard.push(soulCid); }
  const cid = inst.c || knownCid || null;
  if (inst.tags.includes('Condemned')) dest = 'removed';
  if (cid && dest === 'discard') s.pl[inst.o].discard.push(cid);
  else if (cid && dest === 'removed') s.pl[inst.o].removed.push(cid);
  else s.inbox[inst.o].push({ id: newId('in'), c: cid, i: inst.i, d: dest });
  if (s.combat && [s.combat.a, s.combat.tgt, s.combat.blk].includes(inst.i)) s.combat = null;
}
function putOnField(s, seat, cid, iid, hidden, rested) {
  const card = CARD_BY_ID[cid];
  if (!hidden && card.type === 'event') { s.pl[seat].discard.push(cid); return; }
  if (!hidden && card.type === 'location') {
    const old = s.pl[seat].field.find((x) => x.c && CARD_BY_ID[x.c] && CARD_BY_ID[x.c].type === 'location');
    if (old) leave(s, old.i, 'discard');
  }
  const inst = { i: iid, o: seat, r: !!rested, h: !!hidden, t: s.turnNo || 0, m: {}, add: '', tags: [], soul: [] };
  if (!hidden) inst.c = cid;
  s.pl[seat].field.push(inst);
}
const levelOk = (card) => card.level <= R.pub.lv || confirm(`Level ${card.level} is not unlocked yet (currently level ${R.pub.lv}). Play it anyway?`);

// ---------------------------------------------------------------- room: joining
function freshPublic(code) {
  return { v: 1, code, created: Date.now(), started: false, turn: '', turnNo: 0, lv: 1, seats: {},
    pl: { p1: { life: 30, hand: 0, deck: 0, plays: 0 }, p2: { life: 30, hand: 0, deck: 0, plays: 0 } }, log: [] };
}
function dealPrivate(deck) {
  const list = [];
  for (const [cid, n] of Object.entries(deck.cards)) for (let i = 0; i < n; i++) list.push(cid);
  shuffle(list);
  return { hand: list.splice(0, 5), deck: list, hidden: {} };
}
async function createRoom(p) {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let tries = 0; tries < 5; tries++) {
    code = Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
    if (!(await net.getPublic(code))) break;
  }
  const s = freshPublic(code);
  s.seats.p1 = { uid: net.uid, name: p.name };
  const priv = dealPrivate(p.deck);
  s.pl.p1.hand = priv.hand.length; s.pl.p1.deck = priv.deck.length;
  s.log.push({ w: p.name, m: 'created the room.' });
  try {
    await net.setPublic(code, s);
    await net.setPrivate(code, priv);
    await net.setSpectate(code, { hand: priv.hand, hidden: priv.hidden });
  } catch (err) { console.error(err); toast('Could not create the room. Check your connection.'); return; }
  location.hash = '#/room/' + code;
}
async function takeSeat(p) {
  let seat = null;
  R.priv = dealPrivate(p.deck);
  await savePriv();
  const ok = await net.txPublic(R.code, (s) => {
    seat = !s.seats.p1 ? 'p1' : !s.seats.p2 ? 'p2' : null;
    if (!seat) return false;
    s.seats[seat] = { uid: net.uid, name: p.name };
  });
  if (!ok || !seat) { R.priv = null; toast('Both seats are taken. You are watching.'); R.watching = true; render(); return; }
  R.me = seat;
  await tx(() => {}, 'joined the room.');
}
function enterRoom(code) {
  if (R.code === code) return;
  leaveRoom();
  Object.assign(R, { code, pub: null, priv: null, me: null, working: false, watching: false, missing: false, spec: {}, specUid: {}, specStop: {} });
  R.stop = net.watchPublic(code, async (raw) => {
    if (R.code !== code) return;
    if (!raw) { R.missing = true; R.pub = null; render(); return; }
    R.missing = false;
    R.pub = normPublic(raw);
    const seat = ['p1', 'p2'].find((p) => R.pub.seats[p] && R.pub.seats[p].uid === net.uid) || null;
    if (seat && !R.priv) {
      const mineNow = normPrivate(await net.getPrivate(code));
      if (R.code !== code) return;
      if (!R.priv) R.priv = mineNow;
    }
    if (seat) R.me = seat;
    watchSpectatorViews();
    if (location.hash.startsWith('#/room/')) render();
    processPending();
  });
}
function leaveRoom() {
  if (R.stop) R.stop();
  for (const stop of Object.values(R.specStop)) if (stop) stop();
  Object.assign(R, { code: null, pub: null, priv: null, me: null, stop: null, spec: {}, specUid: {}, specStop: {} });
}

// Things only my client can do: put cards sent to my hand/deck where they belong, draw for my turn.
async function processPending() {
  if (!R.me || !R.priv || R.working || !R.pub) return;
  const me = R.me;
  const items = R.pub.inbox[me];
  if (items.length) {
    R.working = true;
    const done = new Set(), toDiscard = [], toRemoved = [];
    let shuffled = false;
    for (const it of items) {
      done.add(it.id);
      const cid = it.c || R.priv.hidden[it.i];
      if (it.i) delete R.priv.hidden[it.i];
      if (!cid) continue;
      if (it.d === 'hand') R.priv.hand.push(cid);
      else if (it.d === 'deckTop') R.priv.deck.unshift(cid);
      else if (it.d === 'deckBottom') R.priv.deck.push(cid);
      else if (it.d === 'deckShuffle') { R.priv.deck.push(cid); shuffled = true; }
      else if (it.d === 'removed') toRemoved.push(cid);
      else toDiscard.push(cid);
    }
    if (shuffled) shuffle(R.priv.deck);
    await savePriv();
    await tx((s) => {
      s.inbox[me] = s.inbox[me].filter((x) => !done.has(x.id));
      s.pl[me].discard.push(...toDiscard);
      s.pl[me].removed.push(...toRemoved);
    });
    R.working = false;
    processPending();
  } else if (R.pub.needDraw === me) {
    R.working = true;
    const got = R.priv.deck.length ? 1 : 0;
    if (got) R.priv.hand.push(R.priv.deck.shift());
    await savePriv();
    await tx((s) => { s.needDraw = ''; }, got ? 'drew a card for the turn.' : 'could not draw: their deck is empty.');
    R.working = false;
    processPending();
  }
}

// ---------------------------------------------------------------- room: my actions
async function draw(n) {
  const k = Math.min(n, R.priv.deck.length);
  if (!k) return toast('Your deck is empty');
  R.priv.hand.push(...R.priv.deck.splice(0, k));
  await savePriv();
  await tx(() => {}, `drew ${k} card${k > 1 ? 's' : ''}.`);
}
async function mill(n) {
  const cards = R.priv.deck.splice(0, Math.min(n, R.priv.deck.length));
  if (!cards.length) return toast('Your deck is empty');
  await savePriv();
  await tx((s) => { s.pl[R.me].discard.push(...cards); }, `milled ${cards.length}: ${cards.map((c) => CARD_BY_ID[c].name).join(', ')}.`);
}
async function shuffleDeck(silent) {
  shuffle(R.priv.deck);
  await savePriv();
  if (!silent) await tx(() => {}, 'shuffled their deck.');
}
async function mulligan() {
  R.priv.deck.push(...R.priv.hand.splice(0));
  shuffle(R.priv.deck);
  R.priv.hand = R.priv.deck.splice(0, 5);
  await savePriv();
  await tx((s) => { s.pl[R.me].mull = true; }, 'took a mulligan.');
}
async function playFromHand(idx, hidden) {
  const cid = R.priv.hand[idx];
  const card = CARD_BY_ID[cid];
  if (!hidden && !levelOk(card)) return;
  R.priv.hand.splice(idx, 1);
  const iid = newId(R.me);
  if (hidden) R.priv.hidden[iid] = cid;
  await savePriv();
  closeModal();
  await tx((s) => { s.pl[R.me].plays = (s.pl[R.me].plays || 0) + 1; putOnField(s, R.me, cid, iid, hidden); },
    hidden ? 'hid a card face down.' : `played ${card.name}.`, hidden ? null : cid);
}
async function handTo(idx, dest) {
  const cid = R.priv.hand.splice(idx, 1)[0];
  const name = CARD_BY_ID[cid].name;
  let msg;
  if (dest === 'deckTop') { R.priv.deck.unshift(cid); msg = 'put a card from hand on top of their deck.'; }
  else if (dest === 'deckBottom') { R.priv.deck.push(cid); msg = 'put a card from hand on the bottom of their deck.'; }
  else if (dest === 'deckShuffle') { R.priv.deck.push(cid); shuffle(R.priv.deck); msg = 'shuffled a card from hand into their deck.'; }
  else if (dest === 'give') msg = 'put a card into their opponent\'s hand.';
  else msg = `discarded ${name}.`;
  await savePriv();
  closeModal();
  await tx((s) => {
    if (dest === 'discard') s.pl[R.me].discard.push(cid);
    if (dest === 'give') s.inbox[opp(R.me)].push({ id: newId('in'), c: cid, d: 'hand' });
  }, msg, dest === 'discard' ? cid : null);
}
async function revealHand() {
  const names = R.priv.hand.map((c) => CARD_BY_ID[c].name).join(', ') || 'no cards';
  await tx(() => {}, `revealed their hand: ${names}.`);
}
// Move a card out of my deck (search, look at top).
async function deckTo(cid, dest) {
  const idx = R.priv.deck.indexOf(cid);
  if (idx < 0) return;
  const card = CARD_BY_ID[cid];
  if (dest === 'field' && !levelOk(card)) return;
  R.priv.deck.splice(idx, 1);
  if (dest === 'hand') R.priv.hand.push(cid);
  if (dest === 'deckBottom') R.priv.deck.push(cid);
  await savePriv();
  const iid = newId(R.me);
  await tx((s) => {
    if (dest === 'field') putOnField(s, R.me, cid, iid, false);
    if (dest === 'discard') s.pl[R.me].discard.push(cid);
  }, dest === 'hand' ? 'took a card from their deck into hand.' : dest === 'deckBottom' ? 'put a card on the bottom of their deck.' : dest === 'field' ? `played ${card.name} from their deck.` : `sent ${card.name} from their deck to the discard pile.`,
  dest === 'field' || dest === 'discard' ? cid : null);
}
// Move a card out of one of my public piles (discard, removed).
async function pileTo(pile, idx, dest) {
  const cid = mine()[pile][idx];
  if (!cid) return;
  const card = CARD_BY_ID[cid];
  if (dest === 'field' && !levelOk(card)) return;
  const iid = newId(R.me);
  const from = pile === 'discard' ? 'their discard pile' : 'removed from play';
  closeModal();
  await tx((s) => {
    const list = s.pl[R.me][pile];
    const at = list[idx] === cid ? idx : list.indexOf(cid);
    if (at < 0) return false;
    list.splice(at, 1);
    if (dest === 'field') { s.pl[R.me].plays = (s.pl[R.me].plays || 0) + 1; putOnField(s, R.me, cid, iid, false); }
    else if (dest === 'discard') s.pl[R.me].discard.push(cid);
    else if (dest === 'removed') s.pl[R.me].removed.push(cid);
    else s.inbox[R.me].push({ id: newId('in'), c: cid, d: dest });
  }, dest === 'field' ? `played ${card.name} from ${from}.` : dest === 'hand' ? `returned ${card.name} from ${from} to hand.` : dest === 'removed' ? `removed ${card.name} from play.` : dest === 'discard' ? `moved ${card.name} to the discard pile.` : `shuffled ${card.name} from ${from} into their deck.`, cid);
}
const instName = (inst) => (inst.c ? CARD_BY_ID[inst.c].name : 'a hidden card');
async function fieldTo(iid, dest, verb) {
  const g = findInst(R.pub, iid);
  if (!g) return;
  let known = null;
  if (!g.inst.c && g.inst.o === R.me && (dest === 'discard' || dest === 'removed')) {
    known = R.priv.hidden[iid] || null;
    delete R.priv.hidden[iid];
    await savePriv();
  }
  const name = known ? CARD_BY_ID[known].name : instName(g.inst);
  closeModal();
  await tx((s) => { if (!findInst(s, iid)) return false; leave(s, iid, dest, known); }, `${verb} ${name}.`, g.inst.c || known);
}
async function editInst(iid, fn, msg) {
  const g = findInst(R.pub, iid);
  await tx((s) => { const f = findInst(s, iid); if (!f) return false; return fn(f.inst, s, f); }, msg && g ? msg(g.inst) : null, g && g.inst.c);
}
async function flipUp(iid) {
  const cid = R.priv.hidden[iid];
  if (!cid) return toast('Only the owner can flip this card');
  const card = CARD_BY_ID[cid];
  if (!levelOk(card)) return;
  delete R.priv.hidden[iid];
  await savePriv();
  await tx((s) => {
    const f = findInst(s, iid);
    if (!f) return false;
    if (card.type === 'event') { leave(s, iid, 'discard', cid); return; }
    f.inst.c = cid; f.inst.h = false;
  }, `Ambush! Flipped ${card.name} face up.`, cid);
}
async function flipDown(iid) {
  const g = findInst(R.pub, iid);
  if (!g || !g.inst.c) return;
  R.priv.hidden[iid] = g.inst.c;
  await savePriv();
  await tx((s) => { const f = findInst(s, iid); if (!f) return false; delete f.inst.c; f.inst.h = true; }, `turned ${instName(g.inst)} face down.`);
}
async function changeLife(p, delta) {
  if (!delta) return;
  await tx((s) => { s.pl[p].life += delta; }, `${delta > 0 ? 'added' : 'removed'} ${Math.abs(delta)} life ${delta > 0 ? 'to' : 'from'} ${seatName(p)} (now ${R.pub.pl[p].life + delta}).`);
}
async function startGame() {
  await tx((s) => {
    if (s.started || !s.seats.p1 || !s.seats.p2) return false;
    s.started = true; s.turn = Math.random() < 0.5 ? 'p1' : 'p2'; s.turnNo = 1;
    s.log.push({ w: '', m: `${s.seats[s.turn].name} was chosen at random to go first. They do not draw or attack this turn.` });
  });
}
async function endTurn() {
  await tx((s) => {
    if (s.turn !== R.me) return false;
    const next = opp(R.me);
    s.turn = next; s.turnNo += 1; s.combat = null; s.needDraw = next;
    s.pl[next].plays = 0;
    for (const c of s.pl[next].field) c.r = false;
  }, 'ended their turn.');
}

// Soul: cards kept underneath a card on the table. Entries are "owner|cardId".
// When the top card leaves the table, its soul goes to the owners' discard piles (see leave()).
async function toSoul(iid, targetIid) {
  const g = findInst(R.pub, iid);
  const t = findInst(R.pub, targetIid);
  if (!g || !t) return;
  let known = g.inst.c || null;
  if (!known && g.inst.o === R.me && R.priv.hidden[iid]) {
    known = R.priv.hidden[iid];
    delete R.priv.hidden[iid];
    await savePriv();
  }
  if (!known) return toast('Flip this card face up first');
  closeModal();
  await tx((s) => {
    const f = findInst(s, iid);
    if (!f || !findInst(s, targetIid)) return false;
    s.pl[f.ctrl].field.splice(f.idx, 1);
    findInst(s, targetIid).inst.soul.push(...f.inst.soul, f.inst.o + '|' + known);
    if (s.combat && [s.combat.a, s.combat.tgt, s.combat.blk].includes(iid)) s.combat = null;
  }, `put ${CARD_BY_ID[known].name} into the soul of ${instName(t.inst)}.`, known);
}
async function soulToDiscard(iid, index) {
  const g = findInst(R.pub, iid);
  if (!g) return;
  await tx((s) => {
    const f = findInst(s, iid);
    if (!f) return false;
    const out = index == null ? f.inst.soul.splice(0) : f.inst.soul.splice(index, 1);
    for (const entry of out) { const [owner, cid] = entry.split('|'); s.pl[owner].discard.push(cid); }
  }, index == null ? `sent the whole soul of ${instName(g.inst)} to the discard pile.` : `sent a card from the soul of ${instName(g.inst)} to the discard pile.`);
}
function soulSection(inst, canEdit) {
  const soul = inst.soul || [];
  if (!soul.length && !canEdit) return null;
  return h('div', {}, h('h3', {}, `Soul (${soul.length})`),
    soul.length ? h('div', { class: 'list' }, soul.map((entry, i) => {
      const card = CARD_BY_ID[entry.split('|')[1]];
      return h('div', { class: 'row' }, h('button', { class: 'linkish', onclick: () => showPreview(card) || toast(card.effect || 'No effect.') }, card.name),
        canEdit ? btn('To discard pile', () => soulToDiscard(inst.i, i), 'tiny') : null);
    })) : h('p', { class: 'muted' }, 'No cards under this card.'));
}

// ---------------------------------------------------------------- room: combat
function declareAttack(iid) {
  const s = R.pub;
  const g = findInst(s, iid);
  const warnings = [];
  if (s.turn !== R.me) warnings.push('It is not your turn.');
  if (s.turnNo === 1) warnings.push('The first player cannot attack on their first turn.');
  if (g.inst.t === s.turnNo) warnings.push('This unit was played this turn.');
  if (g.inst.r) warnings.push('This unit is rested.');
  if (g.inst.tags.includes('Guard Duty')) warnings.push('This unit has Guard Duty.');
  if (warnings.length && !confirm(warnings.join(' ') + ' Attack anyway?')) return;
  let col = -1;
  openModal(() => {
    const f = findInst(R.pub, iid);
    if (!f) return null;
    const vals = statsOf(f.inst);
    if (col < 0) {
      return h('div', {}, h('h2', {}, `${instName(f.inst)} attacks`), h('p', {}, 'Choose the color for this combat.'),
        h('div', { class: 'bar' }, vals.map((v, i) => (v == null ? null : h('button', { class: 'btn s-' + COLS[i], onclick: () => { col = i; renderModal(); } }, `${COL_NAMES[i]} ${v}`)))));
    }
    const foe = opp(f.ctrl);
    const targets = R.pub.pl[foe].field.filter((x) => x.c && CARD_BY_ID[x.c].type === 'unit');
    const go = (tgt) => { closeModal(); attack(iid, col, tgt); };
    return h('div', {}, h('h2', {}, `${instName(f.inst)} attacks with ${COL_NAMES[col]} ${vals[col]}`), h('p', {}, 'Choose a target. Only rested units that share the color can be attacked.'),
      h('div', { class: 'list' },
        btn(`${seatName(foe)} (the player)`, () => go('P'), 'primary'),
        targets.map((x) => {
          const v = statsOf(x)[col];
          const why = !x.r ? 'stood' : v == null ? `no ${COL_NAMES[col]}` : '';
          return h('button', { class: 'btn', disabled: !!why, onclick: () => go(x.i) }, `${instName(x)} ${why ? '(' + why + ')' : `(${COL_NAMES[col]} ${v})`}`);
        })),
      btn('Back', () => { col = -1; renderModal(); }));
  });
}
async function attack(iid, col, tgt) {
  const g = findInst(R.pub, iid);
  const target = tgt === 'P' ? seatName(opp(g.ctrl)) : instName(findInst(R.pub, tgt).inst);
  await tx((s) => {
    const f = findInst(s, iid);
    if (!f) return false;
    f.inst.r = true;
    s.combat = { a: iid, ak: f.ctrl, col, tgt, blk: '', st: tgt === 'P' ? 'block' : 'resolve' };
  }, `attacks ${target} with ${instName(g.inst)} (${COL_NAMES[col]} ${statsOf(g.inst)[col]}).`, g.inst.c);
}
function blockers(s) {
  const c = s.combat;
  const def = opp(c.ak);
  const units = s.pl[def].field.filter((x) => x.c && CARD_BY_ID[x.c].type === 'unit');
  const anyHasColor = units.some((x) => statsOf(x)[c.col] != null);
  return units.filter((x) => !x.r && (statsOf(x)[c.col] != null || !anyHasColor));
}
async function chooseBlock(iid) {
  await tx((s) => {
    if (!s.combat || s.combat.st !== 'block') return false;
    if (iid) { const f = findInst(s, iid); if (!f) return false; f.inst.r = true; s.combat.blk = iid; }
    s.combat.st = 'resolve';
  }, iid ? `blocks with ${instName(findInst(R.pub, iid).inst)}.` : 'does not block.');
}
function outcome(s) {
  const c = s.combat;
  const A = findInst(s, c.a);
  if (!A) return null;
  const av = statsOf(A.inst)[c.col] || 0;
  const defId = c.tgt === 'P' ? c.blk : c.tgt;
  if (!defId) return { av, damageTo: opp(c.ak), text: `${instName(A.inst)} is unblocked: ${s.seats[opp(c.ak)].name} loses ${av} life.` };
  const D = findInst(s, defId);
  if (!D) return null;
  const dv = statsOf(D.inst)[c.col] || 0;
  const dead = av > dv ? [D.inst] : av < dv ? [A.inst] : [A.inst, D.inst];
  return { av, dv, dead: dead.map((x) => x.i), text: `${instName(A.inst)} ${av} vs ${instName(D.inst)} ${dv} in ${COL_NAMES[c.col]}: ${dead.length === 2 ? 'a tie, both are killed' : instName(dead[0]) + ' is killed'}.` };
}
async function applyCombat() {
  const o = outcome(R.pub);
  await tx((s) => {
    if (!s.combat || s.combat.st !== 'resolve') return false;
    const r = outcome(s);
    if (r && r.damageTo) s.pl[r.damageTo].life -= r.av;
    else if (r) for (const id of r.dead) leave(s, id, 'discard');
    s.combat = null;
  }, o ? 'Combat: ' + o.text : 'Combat ended.');
}
const cancelCombat = () => tx((s) => { s.combat = null; }, 'cancelled the combat (no result applied).');

// ---------------------------------------------------------------- room: menus
function fieldMenu(iid) {
  let picking = false;
  openModal(() => {
    const f = R.pub && findInst(R.pub, iid);
    if (!f) return null;
    const inst = f.inst;
    const myHidden = !inst.c && R.me && R.priv && R.priv.hidden[iid];
    const card = CARD_BY_ID[inst.c || secretOf(inst)];
    const head = card ? cardDetail(card, inst.c ? inst : null) : h('div', { class: 'detail' }, h('strong', {}, 'Hidden card'), h('p', { class: 'muted' }, 'Face down. Only its owner and spectators know what it is.'));
    if (!R.me) return h('div', {}, head, !inst.c && card ? h('p', { class: 'muted' }, 'This card is face down. The other player cannot see it.') : null, soulSection(inst, false));
    if (picking) {
      const others = ['p1', 'p2'].flatMap((p) => R.pub.pl[p].field).filter((x) => x.i !== iid);
      return h('div', {}, h('h2', {}, 'Put this card under which card?'),
        others.length ? h('div', { class: 'list' }, others.map((x) => btn(`${instName(x)} (${seatName(x.o)})`, () => toSoul(iid, x.i)))) : h('p', { class: 'muted' }, 'There are no other cards on the table.'),
        btn('Back', () => { picking = false; renderModal(); }));
    }
    const isUnit = card && card.type === 'unit' && inst.c;
    const vals = statsOf(inst);
    const stat = (i) => h('div', { class: 'stat-edit' }, h('span', { class: 'stat s-' + COLS[i] }, vals[i] == null ? '–' : vals[i]),
      vals[i] == null
        ? btn('add ' + COL_NAMES[i], () => editInst(iid, (x) => { x.add += COLS[i]; }, (x) => `gave ${instName(x)} ${COL_NAMES[i]} 0.`), 'tiny')
        : [btn('−', () => editInst(iid, (x) => { x.m[COLS[i]] = (x.m[COLS[i]] || 0) - 1; }, (x) => `${instName(x)}: ${COL_NAMES[i]} −1.`), 'tiny'),
           btn('+', () => editInst(iid, (x) => { x.m[COLS[i]] = (x.m[COLS[i]] || 0) + 1; }, (x) => `${instName(x)}: ${COL_NAMES[i]} +1.`), 'tiny')]);
    const send = (label, dest, verb, cls) => btn(label, () => fieldTo(iid, dest, verb), cls);
    return h('div', {}, head, myHidden ? h('p', { class: 'muted' }, 'This card is face down. Your opponent cannot see it.') : null,
      h('div', { class: 'bar' },
        btn(inst.r ? 'Stand' : 'Rest', () => editInst(iid, (x) => { x.r = !x.r; }, (x) => `${x.r ? 'stood' : 'rested'} ${instName(x)}.`), 'primary'),
        isUnit && f.ctrl === R.me ? btn('Attack', () => { closeModal(); declareAttack(iid); }, 'primary') : null,
        myHidden ? btn('Flip face up (Ambush)', () => flipUp(iid), 'primary') : null,
        inst.c && inst.o === R.me ? btn('Turn face down', () => flipDown(iid)) : null,
        btn(f.ctrl === R.me ? 'Give control to opponent' : 'Take control', () => editInst(iid, (x, s, g) => { s.pl[g.ctrl].field.splice(g.idx, 1); s.pl[opp(g.ctrl)].field.push(x); }, (x) => `changed control of ${instName(x)}.`))),
      isUnit ? h('div', {}, h('h3', {}, 'Stats'), h('div', { class: 'stat-row' }, [0, 1, 2, 3].map(stat))) : null,
      h('h3', {}, 'Markers'),
      h('div', { class: 'bar' }, TAGS.map((t) => h('button', { class: 'btn' + (inst.tags.includes(t) ? ' on' : ''), onclick: () => editInst(iid, (x) => { x.tags = x.tags.includes(t) ? x.tags.filter((y) => y !== t) : [...x.tags, t]; }, (x) => (x.tags.includes(t) ? `removed the ${t} marker from ${instName(x)}.` : `marked ${instName(x)} as ${t}.`)) }, t)),
        btn('Note', () => { const n = prompt('Note shown on this card (leave empty to clear)', inst.note || ''); if (n != null) editInst(iid, (x) => { x.note = n.slice(0, 40); }); })),
      soulSection(inst, true),
      h('div', { class: 'bar' }, btn('Put this card into a soul', () => { picking = true; renderModal(); }), inst.soul.length ? btn('Send whole soul to discard pile', () => soulToDiscard(iid)) : null),
      h('h3', {}, 'Move'),
      h('div', { class: 'bar' }, send('Kill', 'discard', 'killed', 'danger'), send('Send to discard pile', 'discard', 'sent to the discard pile:'), send('Return to hand', 'hand', 'returned to hand:'),
        send('Deck top', 'deckTop', 'put on top of the deck:'), send('Deck bottom', 'deckBottom', 'put on the bottom of the deck:'), send('Shuffle into deck', 'deckShuffle', 'shuffled into the deck:'), send('Remove from play', 'removed', 'removed from play:')));
  });
}
function handMenu(idx) {
  const cid = R.priv.hand[idx];
  openModal(() => {
    if (R.priv.hand[idx] !== cid) return null;
    const card = CARD_BY_ID[cid];
    return h('div', {}, cardDetail(card),
      h('div', { class: 'bar' }, btn(card.type === 'event' ? 'Play event' : 'Play', () => playFromHand(idx, false), 'primary'), btn('Play face down (Hide)', () => playFromHand(idx, true))),
      h('div', { class: 'bar' }, btn('Discard', () => handTo(idx, 'discard')), btn('Deck top', () => handTo(idx, 'deckTop')), btn('Deck bottom', () => handTo(idx, 'deckBottom')), btn('Shuffle into deck', () => handTo(idx, 'deckShuffle')), btn('Put in opponent\'s hand', () => handTo(idx, 'give'))));
  });
}
function pileMenu(p, pile) {
  const title = `${seatName(p)}: ${pile === 'discard' ? 'discard pile' : 'removed from play'}`;
  let picked = -1;
  openModal(() => {
    const list = R.pub.pl[p][pile];
    if (picked >= 0 && list[picked]) {
      const card = CARD_BY_ID[list[picked]];
      const idx = picked;
      const mv = (label, dest) => btn(label, () => pileTo(pile, idx, dest));
      return h('div', {}, cardDetail(card), p === R.me ? h('div', { class: 'bar' }, mv('Play to field', 'field'), mv('To hand', 'hand'), mv('Shuffle into deck', 'deckShuffle'), pile === 'discard' ? mv('Remove from play', 'removed') : mv('To discard pile', 'discard')) : null,
        btn('Back', () => { picked = -1; renderModal(); }));
    }
    return h('div', {}, h('h2', {}, title), list.length ? h('div', { class: 'grid' }, list.map((cid, i) => cardView(CARD_BY_ID[cid], { text: false, onclick: () => { picked = i; renderModal(); } })).reverse()) : h('p', { class: 'muted' }, 'Empty.'));
  });
}
function deckMenu() {
  let mode = 'menu';
  let searched = false;
  const finish = async () => { if (searched) { searched = false; shuffle(R.priv.deck); await savePriv(); await tx(() => {}, 'searched their deck and shuffled it.'); } };
  openModal(() => {
    const deck = R.priv.deck;
    if (mode === 'search') {
      const sorted = [...new Set(deck)].sort((a, b) => CARD_BY_ID[a].name.localeCompare(CARD_BY_ID[b].name));
      const take = (cid, dest) => async () => { await deckTo(cid, dest); renderModal(); };
      return h('div', {}, h('h2', {}, 'Search your deck'), h('p', { class: 'muted' }, 'Your deck is shuffled when you finish.'),
        h('div', { class: 'list' }, sorted.map((cid) => h('div', { class: 'row' }, h('button', { class: 'linkish', onclick: () => toast(CARD_BY_ID[cid].effect || 'No effect.') }, `${deck.filter((x) => x === cid).length}× ${CARD_BY_ID[cid].name}`),
          h('span', { class: 'row-actions' }, btn('Hand', take(cid, 'hand'), 'tiny'), btn('Field', take(cid, 'field'), 'tiny'), btn('Discard', take(cid, 'discard'), 'tiny'))))),
        btn('Done (shuffle)', closeModal, 'primary'));
    }
    if (mode === 'top') {
      if (!deck.length) return h('p', {}, 'Your deck is empty.');
      const cid = deck[0];
      return h('div', {}, h('h2', {}, 'Top card of your deck'), cardDetail(CARD_BY_ID[cid]),
        h('div', { class: 'bar' }, btn('Leave on top', closeModal, 'primary'), btn('Put on bottom', async () => { await deckTo(cid, 'deckBottom'); closeModal(); }), btn('Draw it', async () => { closeModal(); await draw(1); })));
    }
    const n = (label, fn) => btn(label, async () => { closeModal(); await fn(); });
    return h('div', {}, h('h2', {}, `Your deck (${deck.length})`),
      h('div', { class: 'bar' }, n('Draw 1', () => draw(1)), n('Draw 2', () => draw(2)), n('Mill 1', () => mill(1)), n('Mill 3', () => mill(3)), n('Mill 5', () => mill(5))),
      h('div', { class: 'bar' }, btn('Look at top card', async () => { await tx(() => {}, 'looked at the top card of their deck.'); mode = 'top'; renderModal(); }), btn('Search deck', () => { mode = 'search'; searched = true; renderModal(); }), n('Shuffle', () => shuffleDeck()), n('Reveal hand to everyone', revealHand)));
  }, finish);
}
function lifeMenu(p) {
  openModal(() => h('div', {}, h('h2', {}, `${seatName(p)}: ${R.pub.pl[p].life} life`),
    h('div', { class: 'bar' }, [-5, -3, -1, 1, 3, 5].map((d) => btn((d > 0 ? '+' : '−') + Math.abs(d), () => changeLife(p, d), d < 0 ? 'danger' : ''))),
    btn('Other amount', () => { const v = Number(prompt('Change life by (use a minus sign to lose life)', '-2')); if (v) changeLife(p, Math.trunc(v)); })));
}

// ---------------------------------------------------------------- room: table
function pileChip(label, n, onclick) { return h('button', { class: 'chip', onclick }, h('span', { class: 'chip-n' }, n), label); }
function playerStrip(p, isMe) {
  const d = R.pub.pl[p];
  const turn = R.pub.started && R.pub.turn === p;
  return h('div', { class: 'strip' + (turn ? ' active' : ''), 'data-seat': p },
    h('div', { class: 'who' }, h('strong', {}, seatName(p)), isMe ? h('span', { class: 'muted' }, ' (you)') : null, turn ? h('span', { class: 'turn-flag' }, 'their turn') : null),
    h('button', { class: 'life', 'data-life': p, disabled: !R.me, onclick: () => lifeMenu(p) }, h('span', { class: 'life-n' }, d.life), ' life'),
    h('div', { class: 'chips' },
      pileChip('hand', d.hand, null),
      pileChip('deck', d.deck, isMe ? deckMenu : null),
      pileChip('discard', d.discard.length, () => pileMenu(p, 'discard')),
      pileChip('removed', d.removed.length, () => pileMenu(p, 'removed')),
      turn ? h('span', { class: 'chip' }, h('span', { class: 'chip-n' }, d.plays || 0), 'plays used',
        isMe ? [btn('−', () => tx((s) => { s.pl[p].plays = Math.max(0, (s.pl[p].plays || 0) - 1); }), 'tiny'), btn('+', () => tx((s) => { s.pl[p].plays = (s.pl[p].plays || 0) + 1; }), 'tiny')] : null) : null),
    isMe && turn ? btn('End turn', endTurn, 'primary end-turn') : null);
}
// Spectators see each player's hand under that player's name.
function spectatorHand(p) {
  if (!spectating() || !R.pub.seats[p]) return null;
  const hand = R.spec[p] ? R.spec[p].hand : [];
  return h('section', { class: 'hand spec-hand', 'data-spec-hand': p }, h('h2', {}, `${seatName(p)}'s hand (${hand.length})`),
    h('div', { class: 'hand-row' }, hand.map((cid) => cardView(CARD_BY_ID[cid], { onclick: () => openModal(() => cardDetail(CARD_BY_ID[cid])) })), hand.length ? null : h('p', { class: 'muted' }, 'No cards in hand.')));
}
function fieldRow(p) {
  const cards = R.pub.pl[p].field;
  const view = (inst) => {
    const card = CARD_BY_ID[inst.c || secretOf(inst)];
    return cardView(card, { inst, onclick: () => fieldMenu(inst.i) });
  };
  const isLoc = (x) => x.c && CARD_BY_ID[x.c].type === 'location';
  const loc = cards.find(isLoc);
  return h('div', { class: 'field', 'data-field': p },
    h('div', { class: 'loc-slot' }, loc ? view(loc) : h('div', { class: 'empty-slot' }, 'No location')),
    h('div', { class: 'units' }, cards.filter((x) => x !== loc).map(view), cards.length - (loc ? 1 : 0) ? null : h('div', { class: 'empty-slot wide' }, 'No cards in play')));
}
function combatPanel() {
  const s = R.pub, c = s.combat;
  if (!c) return null;
  const A = findInst(s, c.a);
  if (!A) return null;
  const def = opp(c.ak);
  if (c.st === 'block') {
    const head = `${s.seats[c.ak].name} attacks ${s.seats[def].name} with ${instName(A.inst)} (${COL_NAMES[c.col]} ${statsOf(A.inst)[c.col]}).`;
    if (R.me !== def) return h('div', { class: 'combat' }, h('p', {}, head), h('p', { class: 'muted' }, `Waiting for ${s.seats[def].name} to block or not.`), R.me ? btn('Cancel combat', cancelCombat) : null);
    const list = blockers(s);
    return h('div', { class: 'combat mine' }, h('p', {}, head), h('p', {}, 'Block with a stood unit, or take the hit.'),
      h('div', { class: 'bar' }, list.map((x) => { const v = statsOf(x)[c.col]; return btn(`Block with ${instName(x)} (${v == null ? 'counts as 0' : COL_NAMES[c.col] + ' ' + v})`, () => chooseBlock(x.i), 'primary'); }),
        btn("Don't block", () => chooseBlock(''), 'danger')));
  }
  const o = outcome(s);
  return h('div', { class: 'combat' }, h('p', {}, o ? o.text : 'A card in this combat has left play.'),
    R.me ? h('div', { class: 'bar' }, btn('Apply result', applyCombat, 'primary'), btn('Cancel combat', cancelCombat)) : null,
    R.me ? h('p', { class: 'muted' }, 'Change stats or use effects first if needed. The result updates as stats change.') : null);
}
function joinPanel() {
  const s = R.pub;
  if (R.me || R.watching) return null;
  if (s.seats.p1 && s.seats.p2) return h('p', { class: 'notice' }, 'You are watching as a spectator. You can see both hands and face-down cards, but not the decks.');
  const setup = playerSetup();
  return h('section', { class: 'panel' }, h('h2', {}, 'Join this room'), setup.el,
    h('div', { class: 'bar' }, btn('Join as player', async () => { const p = setup.read(); if (p) await takeSeat(p); }, 'primary'), btn('Just watch', () => { R.watching = true; render(); })));
}
function viewRoom() {
  if (R.missing) return h('main', {}, h('h1', {}, 'Room not found'), h('p', {}, `There is no room with the code ${R.code}.`), h('a', { class: 'btn', href: '#/' }, 'Back to home'));
  const s = R.pub;
  if (!s) return h('main', {}, h('p', { class: 'muted' }, 'Connecting to the room…'));
  const bottom = R.me || 'p1';
  const top = opp(bottom);
  const link = location.origin + location.pathname + '#/room/' + s.code;
  const loser = ['p1', 'p2'].find((p) => s.pl[p].life <= 0);
  const emptyDeck = s.started ? ['p1', 'p2'].find((p) => s.seats[p] && s.pl[p].deck === 0) : null;
  return h('main', { class: 'room' },
    h('div', { class: 'room-bar' },
      h('span', {}, 'Room ', h('strong', { class: 'code' }, s.code)),
      btn('Copy invite link', () => { navigator.clipboard?.writeText(link).then(() => toast('Invite link copied'), () => prompt('Copy this link', link)); }),
      h('span', { class: 'lvl' }, 'Level ', h('strong', {}, s.lv), ' unlocked'),
      s.started ? h('span', { class: 'muted' }, 'Turn ' + s.turnNo) : null,
      !R.me ? h('span', { class: 'tag' }, 'Spectating') : null),
    modeNote(), joinPanel(),
    loser ? h('p', { class: 'banner' }, `${seatName(loser)} is at 0 life. ${seatName(opp(loser))} wins.`) : null,
    emptyDeck && !loser ? h('p', { class: 'notice' }, `${seatName(emptyDeck)}'s deck is empty. They lose unless a card says otherwise.`) : null,
    !s.started ? h('section', { class: 'panel' },
      s.seats.p1 && s.seats.p2
        ? [h('p', {}, 'Both players are here.'), R.me ? h('div', { class: 'bar' }, btn('Start game', startGame, 'primary'), mine().mull ? null : btn('Mulligan (once)', mulligan)) : h('p', { class: 'muted' }, 'Waiting for the players to start.')]
        : [h('p', {}, 'Waiting for a second player. Share the code ', h('strong', { class: 'code' }, s.code), ' or the invite link.'), R.me && !mine().mull ? btn('Mulligan (once)', mulligan) : null]) : null,
    h('div', { class: 'room-grid' },
      h('div', { class: 'table' },
        playerStrip(top, false), spectatorHand(top), fieldRow(top), combatPanel(), fieldRow(bottom), playerStrip(bottom, !!R.me), spectatorHand(bottom),
        R.me && R.priv ? h('section', { class: 'hand' }, h('h2', {}, `Your hand (${R.priv.hand.length})`),
          h('div', { class: 'hand-row' }, R.priv.hand.map((cid, i) => cardView(CARD_BY_ID[cid], { onclick: () => handMenu(i) })), R.priv.hand.length ? null : h('p', { class: 'muted' }, 'No cards in hand.'))) : null),
      h('aside', { class: 'side' },
        h('section', { class: 'preview-wrap' }, h('h2', {}, 'Card'), h('div', { class: 'preview' }, previewBody())),
        h('section', { class: 'log' }, h('h2', {}, 'Game log'),
          h('ol', {}, [...s.log].reverse().map((e) => h('li', {}, e.w ? h('strong', {}, e.w + ' ') : null, e.m, e.c && CARD_BY_ID[e.c] ? h('button', { class: 'linkish', onclick: () => openModal(() => cardDetail(CARD_BY_ID[e.c])) }, ' view card') : null)))))));
}

// ---------------------------------------------------------------- router
function nav() {
  const link = (href, label) => h('a', { href, class: location.hash.startsWith(href) && (href !== '#/' || location.hash === '#/') ? 'current' : '' }, label);
  return h('nav', {}, h('a', { class: 'brand', href: '#/' }, 'That One Game'), link('#/library', 'Library'), link('#/decks', 'Decks'), R.code ? link('#/room/' + R.code, 'Room ' + R.code) : null);
}
function render() {
  const hash = location.hash || '#/';
  const parts = hash.slice(2).split('/');
  let view;
  if (parts[0] === 'room' && parts[1]) { enterRoom(parts[1].toUpperCase()); view = viewRoom(); }
  else if (parts[0] === 'library') view = viewLibrary();
  else if (parts[0] === 'decks' && parts[1]) view = viewDeckEdit(parts[1]);
  else if (parts[0] === 'decks') view = viewDecks();
  else view = viewHome();
  const y = window.scrollY;
  $app.replaceChildren(nav(), view);
  window.scrollTo(0, y);
  renderModal();
}
window.addEventListener('hashchange', () => { closeModal(); window.scrollTo(0, 0); render(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalFn) closeModal(); });

$app.replaceChildren(h('p', { class: 'muted pad' }, 'Loading…'));
connect().then((n) => { net = n; render(); });
