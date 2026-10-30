// Всё хранится только на устройстве (localStorage). Сервера нет.
// У каждой записи есть время изменения `t`: так при загрузке кода с другого устройства побеждает более свежее.
import seed from '../../shared/catalog.json';

const KEY = 'bjj.doc.v2';
const now = () => Date.now();
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} };

export const emptyDoc = () => ({ status: {}, notes: {}, tnotes: {}, chains: {}, sessions: {}, profile: { name: '', gym: '', belt: 'white', stripes: 0, t: 0 }, mode: { v: 'all', t: 0 } });

export let doc = Object.assign(emptyDoc(), read(KEY, {}));
export const catalog = seed;

let listeners = [];
export const onChange = fn => listeners.push(fn);
const emit = () => listeners.forEach(fn => fn());

function persist() { write(KEY, doc) }

// ---- чтение ----
export const lv = id => doc.status[id]?.v || 0;
export const mode = () => doc.mode?.v || 'all';
export const chains = () => Object.entries(doc.chains).filter(([, c]) => !c.del).map(([id, c]) => ({ id, ...c })).sort((a, b) => a.t - b.t);
export const sessions = () => Object.entries(doc.sessions).filter(([, s]) => !s.del).map(([id, s]) => ({ id, ...s }));
export const note = pid => doc.notes[pid]?.text || '';
export const tnote = id => doc.tnotes?.[id]?.text || '';
export const profile = () => doc.profile;
export const hasMarks = () => Object.values(doc.status).some(r => r.v > 0);

// ---- запись ----
export function setLv(id, v) { doc.status[id] = { v, t: now() }; persist() }
export function setMode(v) { doc.mode = { v, t: now() }; persist() }
export function setNote(pid, text) { doc.notes[pid] = { text, t: now() }; persist() }
export function setTnote(id, text) { doc.tnotes = doc.tnotes || {}; doc.tnotes[id] = { text, t: now() }; persist() }
export function setProfile(patch) { doc.profile = { ...doc.profile, ...patch, t: now() }; persist() }
export function addChain(c) { doc.chains[uid()] = { ...c, t: now() }; persist() }
export function delChain(id) { doc.chains[id] = { del: true, t: now() }; persist() }
export function addSession(s) { doc.sessions[uid()] = { ...s, t: now() }; persist() }
export function delSession(id) { doc.sessions[id] = { del: true, t: now() }; persist() }
export function resetAll() {
  const t = now(), d = emptyDoc();
  for (const id of Object.keys(doc.status)) d.status[id] = { v: 0, t };
  for (const id of Object.keys(doc.notes)) d.notes[id] = { text: '', t };
  for (const id of Object.keys(doc.tnotes || {})) d.tnotes[id] = { text: '', t };
  for (const id of Object.keys(doc.chains)) d.chains[id] = { del: true, t };
  for (const id of Object.keys(doc.sessions)) d.sessions[id] = { del: true, t };
  d.profile.t = t; d.mode = { v: mode(), t };
  doc = d; persist();
}
const uid = () => now().toString(36) + Math.random().toString(36).slice(2, 7);

// Код переноса: свой формат и формат первой версии (artifact), где status — числа.
export function exportCode() { return JSON.stringify({ app: 'bjj-map', v: 3, doc }) }
export function importCode(txt) {
  const d = JSON.parse(txt);
  const t = now(), techs = new Set(catalog.techniques.map(x => x.id)), poss = new Set(catalog.positions.map(x => x.id));
  let n = 0;
  if (d.v === 3 && d.doc) { doc = mergeLocal(doc, d.doc); n = Object.keys(d.doc.status || {}).length }
  else if (d.status) {
    for (const [id, v] of Object.entries(d.status)) if (techs.has(id) && [1, 2, 3].includes(v)) { doc.status[id] = { v, t }; n++ }
    for (const c of d.chains || []) if (poss.has(c.start) && c.steps?.every(s => techs.has(s))) doc.chains[c.id || uid()] = { name: c.name, start: c.start, steps: c.steps, t };
    for (const s of d.sessions || []) if (s.date) doc.sessions[s.id || uid()] = { date: s.date, kind: s.kind || 'gi', dur: s.dur || '', techs: (s.techs || []).filter(x => techs.has(x.id)), note: s.note || '', t };
    for (const [pid, text] of Object.entries(d.notes || {})) if (poss.has(pid)) doc.notes[pid] = { text, t };
    for (const [tid, text] of Object.entries(d.tnotes || {})) if (techs.has(tid)) doc.tnotes[tid] = { text, t };
    if (d.profile) doc.profile = { ...doc.profile, ...d.profile, t };
  } else throw new Error('bad code');
  persist(); emit();
  return n;
}
function mergeLocal(a, b) {
  const out = emptyDoc(), ts = x => x?.t || 0;
  for (const k of ['status', 'notes', 'tnotes', 'chains', 'sessions']) {
    for (const id of new Set([...Object.keys(a[k] || {}), ...Object.keys(b[k] || {})])) out[k][id] = ts(b[k]?.[id]) > ts(a[k]?.[id]) ? b[k][id] : a[k]?.[id] ?? b[k][id];
  }
  for (const k of ['profile', 'mode']) out[k] = ts(b[k]) > ts(a[k]) ? b[k] : a[k] ?? b[k];
  return out;
}
