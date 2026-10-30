import './style.css';
import * as st from './store.js';
import howto from '../../shared/howto.json';
const HOWTO = howto.items;

// ---------- справочник ----------
let POS, T, PMAP, TMAP, GROUPS, TYPE_ORDER, TYPES;
function loadCatalog() {
  const c = st.catalog;
  POS = c.positions; T = c.techniques; GROUPS = c.groups; TYPE_ORDER = c.typeOrder; TYPES = c.types;
  PMAP = Object.fromEntries(POS.map(p => [p.id, p]));
  TMAP = Object.fromEntries(T.map(t => [t.id, t]));
}
loadCatalog();

const LEVELS = ['не знаю', 'учу', 'знаю', 'работает'];
const BELTS = [['white', 'Белый', '#E6E6E6'], ['blue', 'Синий', '#2563C9'], ['purple', 'Фиолетовый', '#7B3FB5'], ['brown', 'Коричневый', '#7A4B2A'], ['black', 'Чёрный', '#141414']];
const KINDS = { gi: 'Ги', nogi: 'Ноу-ги', open: 'Открытый ковёр' };
const TYPE_PL = { takedown: 'Тейкдауны', sweep: 'Свипы', pass: 'Проходы', escape: 'Выходы', sub: 'Сабмишены', trans: 'Переходы' };
const BASE = import.meta.env.BASE_URL;
const PHOTO = { belt: BASE + 'belt.jpg', 'cg-b': BASE + 'guard.jpg' };
const lv = st.lv;

const visTag = tag => { const m = st.mode(); return m === 'all' || tag === 'b' || (m === 'gi' ? tag === 'g' : tag === 'n') };
const techs = () => T.filter(t => visTag(t.tag) && visTag(PMAP[t.from].tag) && visTag(PMAP[t.to].tag));
const positions = () => POS.filter(p => p.id !== 'sub' && visTag(p.tag));
const outOf = pid => techs().filter(t => t.from === pid);
const inTo = pid => techs().filter(t => t.to === pid);
const known = list => list.filter(t => lv(t.id) >= 2).length;

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const yt = t => 'https://www.youtube.com/results?search_query=' + encodeURIComponent('bjj ' + t.orig);
const tagLabel = tag => tag === 'g' ? '<span class="tag">ги</span>' : tag === 'n' ? '<span class="tag">ноу-ги</span>' : '';
const isoDay = d => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10) };
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WD = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const WDL = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const fmtDay = iso => { const d = new Date(iso + 'T12:00:00'); return `${WD[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}` };
const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c };

function gaps() {
  return positions().map(p => {
    const out = outOf(p.id), k = known(out);
    const reach = p.id === 'stand' || inTo(p.id).some(t => lv(t.id) >= 2);
    const sev = k === 0 ? (reach ? 3 : 2) : k === 1 ? 1 : 0;
    const next = out.filter(t => lv(t.id) < 2).sort((a, b) => lv(b.id) - lv(a.id))[0];
    return { p, out, k, sev, next };
  }).sort((a, b) => b.sev - a.sev || a.k - b.k);
}
const gapText = r => r.sev === 3 ? 'Попадаешь сюда, но не знаешь, что делать дальше'
  : r.sev === 2 ? 'Ни одной известной техники отсюда'
  : r.sev === 1 ? 'Одна техника, нужна запасная' : 'Минимум две техники есть';

// ---------- общие куски ----------
const ICONS = {
  home: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
  map: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="8" r="2.5"/><circle cx="10" cy="18" r="2.5"/><path d="M8.3 7l7.4.8M16.6 10l-5 6M7 8.3l2 7.4"/>',
  train: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  profile: '<rect x="3" y="8" width="18" height="6" rx="1"/><path d="M15 11v6M18 11v6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'
};
const icon = (n, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
const NAV = [['home', 'Моя игра'], ['map', 'Карта'], ['train', 'Тренировки'], ['profile', 'Профиль']];
const modeSeg = () => `<div class="seg" role="group" aria-label="Ги или ноу-ги">${[['all', 'Всё'], ['gi', 'Ги'], ['nogi', 'Ноу-ги']].map(([m, n]) => `<button type="button" data-act="mode" data-v="${m}" aria-pressed="${st.mode() === m}">${n}</button>`).join('')}</div>`;

function beltBtn(t) {
  const l = lv(t.id);
  return `<button type="button" class="belt l${l}" data-act="cycle" data-id="${t.id}" aria-label="${esc(t.ru)}: ${LEVELS[l]}. Нажми, чтобы сменить статус"><span class="tip" aria-hidden="true"><i></i><i></i><i></i></span>${LEVELS[l]}</button>`;
}
function techRow(t, dir, prefix = '') {
  const other = dir === 'in' ? PMAP[t.from] : PMAP[t.to];
  const sub = dir === 'out' && t.to === 'sub' ? esc(t.orig)
    : `<a href="#pos-${other.id}">${dir === 'in' ? 'из: ' : '→ '}${esc(other.ru)}</a>`;
  return `<div class="item"><span class="tdot" style="--c:var(--t-${t.type})" aria-hidden="true"></span>
    <span class="grow"><b><a class="tlink" href="#tech-${t.id}">${esc(t.ru)}</a>${tagLabel(t.tag)}${HOWTO[t.id] ? '<span class="tag howto">разбор</span>' : ''}</b><small>${prefix}${sub} · <a href="${yt(t)}" target="_blank" rel="noopener">видео ↗</a></small></span>${beltBtn(t)}</div>`;
}
const ticks = list => `<span class="ticks" aria-hidden="true">${list.map(t => `<i class="l${lv(t.id)}"></i>`).join('')}</span>`;
function chainPath(c) {
  if (!c.steps.length) return `<span class="p pos">${esc(PMAP[c.start]?.ru)}</span>`;
  let h = `<span class="p">${esc(PMAP[c.start]?.ru)}</span>`;
  c.steps.forEach((id, i) => {
    const t = TMAP[id]; if (!t) return;
    const last = i === c.steps.length - 1;
    h += `<span class="ar">→</span><span class="p ${last && t.to === 'sub' ? 'fin' : ''}">${esc(t.ru)}</span>`;
    if (t.to !== 'sub') {
      const open = last && known(outOf(t.to)) === 0;
      h += `<span class="ar">→</span><span class="p ${open ? 'open' : 'pos'}">${esc(PMAP[t.to].ru)}${open ? ': ?' : ''}</span>`;
    }
  });
  return h;
}

// ---------- виды ----------
function vHome() {
  const ts = techs(), w = ts.filter(t => lv(t.id) === 3).length, k = known(ts), l1 = ts.filter(t => lv(t.id) === 1).length;
  const g = gaps().filter(r => r.sev >= 1).slice(0, 4);
  const now = new Date(), cs = st.chains();
  return `<div class="head"><div><div class="eyebrow">${WDL[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}</div><h1 class="h1">Моя игра</h1></div>
      <div class="row"><span class="phone-only">${modeSeg()}</span><a class="btn desk-only" href="#train-new">${icon('plus', 18)}Записать тренировку</a></div></div>
    <div class="home-top">
      <div class="photo hero" style="background-image:url(${PHOTO.belt});background-position:72% 40%">
        <div class="over"><span class="small muted">Работает в спарринге</span>
          <div class="row" style="align-items:baseline"><span class="num" style="font-size:56px">${w}</span><span class="muted">из ${ts.length} техник</span></div>
          <div class="row small"><span><b>${k}</b> <span class="muted">знаю</span></span><span><b>${l1}</b> <span class="muted">учу</span></span></div></div></div>
      <section class="card stack">
        <h2 class="h2">Пробелы</h2>
        ${!st.hasMarks() ? '<p class="empty" style="margin:0">Отметь на карте, что уже знаешь, и здесь появятся позиции, где тебе нечего делать.</p>'
          : g.length ? g.map(r => `<a class="item" href="#pos-${r.p.id}" style="padding:10px 0;border:0;border-bottom:1px solid var(--line);border-radius:0;background:none"><span class="dot"></span><span class="grow"><b>${esc(r.p.ru)}</b><small>${gapText(r)}</small></span><span class="muted">›</span></a>`).join('')
          : '<p class="empty" style="margin:0">Пробелов нет: в каждой позиции знаешь хотя бы две техники.</p>'}
        <a class="small" href="#gaps" style="text-decoration:none">Все позиции по пробелам →</a>
      </section>
    </div>
    <section class="stack">
      <div class="between"><h2 class="h2">Мои связки</h2><a class="small" href="#chain-new" style="text-decoration:none">+ Новая связка</a></div>
      ${cs.length ? `<div class="grid-auto">${cs.map(c => `<div class="card stack"><div class="between"><b>${esc(c.name)}</b><button type="button" class="chip" data-act="del-chain" data-id="${c.id}" aria-label="Удалить связку ${esc(c.name)}" style="padding:2px 10px">×</button></div><div class="path">${chainPath(c)}</div></div>`).join('')}</div>`
        : `<a class="card" href="#chain-new"><b>Собери первую связку</b><div class="small muted">Выбери стартовую позицию и цепочку техник: например, закрытый гард → свип ножницами → маунт → рычаг.</div></a>`}
    </section>`;
}

let mq = '', mGroup = '';
function vMap() {
  const ps = positions();
  const groups = GROUPS.filter(([g]) => ps.some(p => p.group === g));
  const tiles = g => ps.filter(p => p.group === g).map(p => {
    const out = outOf(p.id), k = known(out);
    const gap = k === 0 && inTo(p.id).some(t => lv(t.id) >= 2);
    return `<a class="tile ${gap ? 'gap' : k >= 2 ? 'mine' : ''}" href="#pos-${p.id}"><span><b>${esc(p.ru)}</b><br><small>${esc(p.orig)}</small></span>${ticks(out)}<small style="${gap ? 'color:var(--warn)' : ''}">${gap ? 'пробел' : `${k} из ${out.length} знаю`}</small></a>`;
  }).join('');
  return `<div class="head"><h1 class="h1">Карта</h1><span class="small muted">${ps.length} позиций · ${techs().length} техник</span></div>
    <label class="field" for="mq">${icon('search', 18)}<input id="mq" type="search" placeholder="Позиция или техника: кимура, knee slice" value="${esc(mq)}" autocomplete="off"></label>
    <div class="chips scroll"><button type="button" class="chip" data-act="mgroup" data-v="" aria-pressed="${!mGroup}">Все</button>${groups.map(([g, n]) => `<button type="button" class="chip" data-act="mgroup" data-v="${g}" aria-pressed="${mGroup === g}">${n}</button>`).join('')}</div>
    <div id="mres"></div>
    <div id="mtiles" class="stack" style="gap:22px">${groups.filter(([g]) => !mGroup || g === mGroup).map(([g, n]) => `<section class="stack"><h2 class="h2">${n}</h2><div class="tiles">${tiles(g)}</div></section>`).join('')}</div>
    <div class="legend"><span><span class="ticks"><i></i></span>не знаю</span><span><span class="ticks"><i class="l1"></i></span>учу</span><span><span class="ticks"><i class="l2"></i></span>знаю</span><span><span class="ticks"><i class="l3"></i></span>работает</span></div>`;
}
function fillMapSearch() {
  const el = document.getElementById('mres'), tl = document.getElementById('mtiles'); if (!el) return;
  const s = mq.trim().toLowerCase();
  if (!s) { el.innerHTML = ''; tl.hidden = false; return }
  tl.hidden = true;
  const ps = positions().filter(p => (p.ru + ' ' + p.orig).toLowerCase().includes(s));
  const ts = techs().filter(t => (t.ru + ' ' + t.orig).toLowerCase().includes(s)).slice(0, 40);
  el.innerHTML = (ps.length ? `<div class="stack"><h2 class="h2">Позиции</h2>${ps.map(p => `<a class="item" href="#pos-${p.id}"><span class="grow"><b>${esc(p.ru)}</b><small>${esc(p.orig)}</small></span><span class="muted">›</span></a>`).join('')}</div>` : '')
    + (ts.length ? `<div class="stack" style="margin-top:16px"><h2 class="h2">Техники</h2>${ts.map(t => techRow(t, 'out', esc(PMAP[t.from].ru) + ' ')).join('')}</div>` : '')
    || '<p class="empty">Ничего не нашлось. Попробуй другое слово или русское и английское название.</p>';
}

let posTab = 'out';
function vPos(pid) {
  const p = PMAP[pid];
  if (!p || pid === 'sub') return vMap();
  if (!visTag(p.tag)) return `<a href="#map" class="small">← Карта</a><h1 class="h1">${esc(p.ru)}</h1><p class="muted">Эта позиция есть только в ${p.tag === 'g' ? 'ги' : 'ноу-ги'}. Переключи режим.</p>${modeSeg()}`;
  const out = outOf(pid), inc = inTo(pid), k = known(out), w = out.filter(t => lv(t.id) === 3).length;
  const group = GROUPS.find(g => g[0] === p.group)[1];
  let note = '';
  if (k === 0 && inc.some(t => lv(t.id) >= 2)) note = 'Ты умеешь сюда попадать, но не отметил ни одного действия отсюда.';
  else if (k === 1) note = 'Одна техника отсюда. Хорошо бы иметь хотя бы две.';
  const byType = TYPE_ORDER.map(ty => [ty, out.filter(t => t.type === ty)]).filter(x => x[1].length);
  const img = PHOTO[pid];
  const title = `<div class="eyebrow" style="color:var(--accent)">${group}</div><h1 class="h1" style="font-size:32px">${esc(p.ru)}</h1><div class="muted small">${esc(p.orig)}</div>`;
  return `<div class="row small"><a href="#map" style="text-decoration:none">Карта</a><span class="muted">/</span><span class="muted">${group}</span></div>
  <div class="pos3">
    <section class="c-mid">
      ${img ? `<div class="photo pos-hero" style="background-image:url(${img})"><div class="over">${title}</div></div>` : `<div>${title}</div>`}
      <div class="stats3"><div class="stat"><span class="num">${out.length}</span><span>отсюда</span></div><div class="stat"><span class="num">${k}</span><span>знаю</span></div><div class="stat acc"><span class="num">${w}</span><span>работает</span></div></div>
      ${note ? `<div class="note">${note}</div>` : ''}
      <label class="stack" for="pnote" style="gap:6px"><span class="small muted">Мои заметки</span><textarea id="pnote" data-pos="${pid}" placeholder="Детали от тренера, что не получается">${esc(st.note(pid))}</textarea></label>
      <div class="seg block quiet pos-tabs" role="group" aria-label="Направление"><button type="button" data-act="ptab" data-v="out" aria-pressed="${posTab === 'out'}">Отсюда · ${out.length}</button><button type="button" data-act="ptab" data-v="in" aria-pressed="${posTab === 'in'}">Сюда · ${inc.length}</button></div>
    </section>
    <section class="c-in" ${posTab === 'in' ? '' : 'hidden'}>
      <div class="stack"><h2 class="h2">← Как сюда попасть · ${inc.length}</h2>${inc.length ? inc.map(t => techRow(t, 'in')).join('') : '<p class="empty">Ни одна техника из справочника сюда пока не ведёт.</p>'}</div>
    </section>
    <section class="c-out" ${posTab === 'out' ? '' : 'hidden'}>
      ${byType.length ? byType.map(([ty, list]) => `<div class="stack"><h2 class="h2">${TYPE_PL[ty]} · ${list.length} →</h2>${list.map(t => techRow(t, 'out')).join('')}</div>`).join('') : '<p class="empty">Отсюда техник нет.</p>'}
    </section>
  </div>`;
}

function vGaps() {
  const rows = gaps(), bad = rows.filter(r => r.sev > 0).length;
  return `<a href="#home" class="small" style="text-decoration:none">← Моя игра</a>
    <div class="head"><h1 class="h1">Пробелы</h1><span class="small muted">${bad} из ${rows.length} позиций</span></div>
    <p class="muted" style="margin:0;max-width:62ch">Правило: в каждой позиции знать хотя бы две техники. Выше те, куда ты уже умеешь попадать.</p>
    <div class="stack">${rows.map(r => `<a class="item" href="#pos-${r.p.id}" style="border-left:3px solid ${r.sev ? 'var(--warn)' : 'var(--accent)'}">
      <span class="grow"><b>${esc(r.p.ru)}</b><small>${gapText(r)}${r.next ? ` · дальше: ${esc(r.next.ru)}${lv(r.next.id) === 1 ? ' (учишь)' : ''}` : ''}</small></span>${ticks(r.out)}</a>`).join('')}</div>`;
}

let draftChain = null;
function vChainNew() {
  if (!draftChain) draftChain = { name: '', start: 'cg-b', steps: [] };
  const c = draftChain;
  const cur = c.steps.length ? TMAP[c.steps.at(-1)].to : c.start;
  const opts = cur === 'sub' ? [] : outOf(cur);
  return `<a href="#home" class="small" style="text-decoration:none">← Моя игра</a>
    <h1 class="h1">Новая связка</h1>
    <div class="grid-auto" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
      <label class="box" for="cname"><span>Название</span><input id="cname" type="text" value="${esc(c.name)}" placeholder="Из гарда в рычаг"></label>
      <label class="box" for="cstart"><span>Стартовая позиция</span><select id="cstart">${positions().map(p => `<option value="${p.id}" ${p.id === c.start ? 'selected' : ''}>${esc(p.ru)}</option>`).join('')}</select></label>
    </div>
    <div class="card stack"><span class="small muted">Цепочка</span><div class="path">${chainPath(c)}</div>
      ${c.steps.length ? '<div><button type="button" class="btn ghost" data-act="chain-undo">Убрать последний шаг</button></div>' : ''}</div>
    <section class="stack">
      <h2 class="h2">${cur === 'sub' ? 'Связка закончена сдачей' : `Что дальше из позиции «${esc(PMAP[cur].ru)}»`}</h2>
      ${opts.map(t => `<button type="button" class="item" data-act="chain-add" data-id="${t.id}" style="text-align:left;cursor:pointer;width:100%"><span class="tdot" style="--c:var(--t-${t.type})"></span><span class="grow"><b>${esc(t.ru)}</b><small>${t.to === 'sub' ? 'финиш' : '→ ' + esc(PMAP[t.to].ru)}</small></span><span class="small ${lv(t.id) >= 2 ? '' : 'muted'}">${LEVELS[lv(t.id)]}</span></button>`).join('')}
    </section>
    <div class="sticky-save"><button type="button" class="btn wide" data-act="chain-save" ${c.steps.length ? '' : 'disabled style="opacity:.5"'}>Сохранить связку</button></div>`;
}

function weekStrip() {
  const now = new Date(), mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d });
  const ss = st.sessions(), set = new Set(ss.map(s => s.date)), today = isoDay(now);
  const wk = ss.filter(s => days.some(d => isoDay(d) === s.date));
  const mins = wk.reduce((a, s) => a + (Number(s.dur) || 0), 0);
  return `<div class="card stack"><div class="between"><b>Эта неделя</b><span class="small muted">${wk.length} ${plural(wk.length, 'тренировка', 'тренировки', 'тренировок')}${mins ? ` · ${Math.floor(mins / 60)} ч ${mins % 60} мин` : ''}</span></div>
    <div class="week">${days.map(d => `<div><span>${WD[d.getDay()]}</span><b class="${set.has(isoDay(d)) ? 'on' : ''} ${isoDay(d) === today ? 'today' : ''}">${d.getDate()}</b></div>`).join('')}</div></div>`;
}
function vTrain() {
  const list = st.sessions().sort((a, b) => b.date.localeCompare(a.date) || b.t - a.t);
  return `<div class="head"><h1 class="h1">Тренировки</h1><a class="icon-btn" href="#train-new" aria-label="Записать тренировку">${icon('plus')}</a></div>
    ${weekStrip()}
    <section class="stack"><h2 class="h2">История</h2>
    ${list.length ? `<div class="grid-auto">${list.map(s => `<div class="card stack">
      <div class="between"><span><b>${fmtDay(s.date)}</b><br><span class="small muted">${KINDS[s.kind]}${s.dur ? ` · ${esc(s.dur)} мин` : ''}</span></span><button type="button" class="chip" data-act="del-session" data-id="${s.id}" aria-label="Удалить тренировку" style="padding:2px 10px">×</button></div>
      ${s.techs.length ? `<div class="path">${s.techs.map(x => TMAP[x.id] ? `<span class="p ${x.how === 'spar' ? 'fin' : ''}">${esc(TMAP[x.id].ru)}${x.how === 'spar' ? ' ✓ в спарринге' : ''}</span>` : '').join('')}</div>` : ''}
      ${s.note ? `<p class="small" style="margin:0;color:var(--soft)">${esc(s.note)}</p>` : ''}</div>`).join('')}</div>`
      : '<p class="empty">Записей пока нет. Нажми «+», отметь, что дриллил и что получилось в спарринге: статусы техник обновятся сами.</p>'}
    </section>`;
}

let draftS = null, tq = '';
function vTrainNew() {
  if (!draftS) draftS = { date: isoDay(new Date()), kind: st.mode() === 'nogi' ? 'nogi' : 'gi', dur: '90', techs: [], note: '' };
  const d = draftS;
  return `<a href="#train" class="small" style="text-decoration:none">Отмена</a>
    <h1 class="h1">Новая тренировка</h1>
    <div class="grid-auto" style="grid-template-columns:repeat(2,minmax(0,1fr))">
      <label class="box" for="sdate"><span>Дата</span><input id="sdate" type="date" value="${d.date}"></label>
      <label class="box" for="sdur"><span>Длительность, мин</span><input id="sdur" type="number" inputmode="numeric" min="0" step="5" value="${esc(d.dur)}"></label>
    </div>
    <div class="seg block" role="group" aria-label="Формат">${Object.entries(KINDS).map(([k, n]) => `<button type="button" data-act="skind" data-v="${k}" aria-pressed="${d.kind === k}">${n}</button>`).join('')}</div>
    <section class="stack"><h2 class="h2">Что отрабатывал</h2>
      <label class="field" for="tq">${icon('search', 18)}<input id="tq" type="search" placeholder="Добавить технику" value="${esc(tq)}" autocomplete="off"></label>
      <div id="tres" class="stack"></div>
      ${d.techs.map(x => { const t = TMAP[x.id]; return `<div class="item"><span class="grow"><b>${esc(t.ru)}</b><small>${esc(PMAP[t.from].ru)}</small></span>
        <div class="how"><button type="button" data-act="how" data-id="${t.id}" data-v="drill" aria-pressed="${x.how === 'drill'}">Дриллил</button><button type="button" data-act="how" data-id="${t.id}" data-v="spar" aria-pressed="${x.how === 'spar'}">В спарринге</button></div>
        <button type="button" class="chip" data-act="srm" data-id="${t.id}" aria-label="Убрать ${esc(t.ru)}" style="padding:2px 10px">×</button></div>` }).join('')}
      ${d.techs.length ? '<span class="small muted">«В спарринге» ставит технике статус «работает», «дриллил» — «учу», если она была не отмечена.</span>' : ''}
    </section>
    <label class="stack" for="snote" style="gap:6px"><span class="h2">Заметка</span><textarea id="snote" placeholder="Что показал тренер, что не получилось">${esc(d.note)}</textarea></label>
    <div class="sticky-save"><button type="button" class="btn wide" data-act="ssave">Сохранить тренировку</button></div>`;
}
function fillTechSearch() {
  const el = document.getElementById('tres'); if (!el) return;
  const s = tq.trim().toLowerCase();
  if (!s) { el.innerHTML = ''; return }
  const have = new Set(draftS.techs.map(x => x.id));
  const res = techs().filter(t => !have.has(t.id) && (t.ru + ' ' + t.orig).toLowerCase().includes(s)).slice(0, 8);
  el.innerHTML = res.length ? res.map(t => `<button type="button" class="item" data-act="sadd" data-id="${t.id}" style="text-align:left;cursor:pointer;width:100%;border-style:dashed"><span class="grow"><b>${esc(t.ru)}</b><small>${esc(PMAP[t.from].ru)}</small></span><span class="small" style="color:var(--accent)">+ добавить</span></button>`).join('') : '<p class="empty" style="margin:0">Не нашлось. Попробуй по-английски.</p>';
}

let resetAsk = false;
const storageCard = () => `<section class="card stack"><b>Что хранится и где</b>
    <span class="small muted">Всё, что ты отмечаешь, хранится только в этом браузере на этом устройстве. Никуда не отправляется: у приложения нет сервера и аккаунтов. Чтобы перенести прогресс на другое устройство, используй код ниже. Если очистить данные браузера, прогресс пропадёт, поэтому иногда сохраняй код.</span></section>`;
function vProfile() {
  const pr = st.profile(), b = BELTS.find(x => x[0] === pr.belt) || BELTS[0];
  const ts = techs();
  const cnt = (l, v) => l.filter(t => lv(t.id) === v).length;
  const rows = TYPE_ORDER.map(ty => { const l = ts.filter(t => t.type === ty); return [ty, known(l), l.length, cnt(l, 3), cnt(l, 2), cnt(l, 1)] }).filter(r => r[2]);
  const tot = [cnt(ts, 3), cnt(ts, 2), cnt(ts, 1)];
  const weakest = [...rows].sort((a, b) => a[1] / a[2] - b[1] / b[2])[0];
  return `<h1 class="h1">Профиль</h1>
    ${storageCard()}
    <div class="grid-auto">
      <section class="card stack" style="gap:14px">
        <div class="grid-auto" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">
          <label class="box" for="pname"><span>Имя</span><input id="pname" type="text" value="${esc(pr.name)}" placeholder="Как тебя зовут"></label>
          <label class="box" for="pgym"><span>Зал</span><input id="pgym" type="text" value="${esc(pr.gym)}" placeholder="Где тренируешься"></label>
          <label class="box" for="pbelt"><span>Пояс</span><select id="pbelt">${BELTS.map(x => `<option value="${x[0]}" ${x[0] === pr.belt ? 'selected' : ''}>${x[1]}</option>`).join('')}</select></label>
          <label class="box" for="pstr"><span>Полосы</span><select id="pstr">${[0, 1, 2, 3, 4].map(n => `<option value="${n}" ${n === Number(pr.stripes) ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        </div>
        <div class="beltbar" aria-hidden="true"><span class="body" style="background:${b[2]}"></span><span class="blk" style="${pr.belt === 'black' ? 'background:#B3261E' : ''}">${[0, 1, 2, 3].map(i => `<i class="${i < pr.stripes ? 'on' : ''}"></i>`).join('')}</span><span class="end" style="background:${b[2]}"></span></div>
        <b>${b[1]} пояс · ${pr.stripes} ${plural(Number(pr.stripes), 'полоса', 'полосы', 'полос')}</b>
      </section>
      <section class="card stack">
        <b>Что знаю по типам</b>
        <span class="small muted">Отмечено ${tot[0] + tot[1] + tot[2]} из ${ts.length}: работает ${tot[0]}, знаю ${tot[1]}, учу ${tot[2]}</span>
        ${rows.map(([ty, k, n, w3, w2, w1]) => `<div class="stack" style="gap:4px"><div class="between small"><span>${TYPE_PL[ty]}</span><span class="muted">${k} из ${n}${w1 ? ` · учу ${w1}` : ''}</span></div><div class="bar stacked ${weakest && weakest[0] === ty && k / n < .5 ? 'weak' : ''}"><i class="s3" style="width:${w3 / n * 100}%"></i><i class="s2" style="width:${w2 / n * 100}%"></i><i class="s1" style="width:${w1 / n * 100}%"></i></div></div>`).join('')}
        <div class="legend"><span><span class="ticks"><i class="l3"></i></span>работает</span><span><span class="ticks"><i class="l2"></i></span>знаю</span><span><span class="ticks"><i class="l1"></i></span>учу</span></div>
        ${weakest ? `<span class="tiny">Слабее всего: ${TYPE_PL[weakest[0]].toLowerCase()}</span>` : ''}
      </section>
    </div>
    <section class="card stack"><b>Режим по умолчанию</b>${modeSeg()}</section>
    <section class="card stack">
      <b>Перенести прогресс кодом</b>
      <span class="small muted">Подходит и для переноса из первой версии приложения: там код в разделе «Профиль» или «Прогресс».</span>
      <textarea id="exp" readonly aria-label="Код прогресса" style="font-size:12px;min-height:80px">${esc(st.exportCode())}</textarea>
      <div class="row"><button type="button" class="btn" data-act="copy">Скопировать код</button></div>
      <textarea id="imp" placeholder="Вставь сюда код с другого устройства" aria-label="Вставить код прогресса" style="min-height:70px"></textarea>
      <div class="row" style="flex-wrap:wrap"><button type="button" class="btn ghost" data-act="import">Загрузить код</button><span id="impmsg" class="small muted"></span></div>
    </section>
    <section class="card stack">
      <b>Сбросить всё</b><span class="small muted">Удалит отметки, связки, тренировки и заметки на этом устройстве.</span>
      <div class="row" style="flex-wrap:wrap">${resetAsk ? '<button type="button" class="btn danger" data-act="reset-yes">Да, удалить всё</button><button type="button" class="btn ghost" data-act="reset-no">Отмена</button>' : '<button type="button" class="btn danger" data-act="reset">Сбросить</button>'}</div>
    </section>`;
}

function vTech(id) {
  const t = TMAP[id];
  if (!t) return vMap();
  const from = PMAP[t.from], to = PMAP[t.to], l = lv(id), h = HOWTO[id];
  const next = t.to === 'sub' ? [] : outOf(t.to).filter(x => x.id !== id).slice(0, 6);
  const alt = outOf(t.from).filter(x => x.id !== id && x.type === t.type);
  const logs = st.sessions().filter(s => s.techs.some(x => x.id === id)).sort((a, b) => b.date.localeCompare(a.date));
  const spar = logs.filter(s => s.techs.some(x => x.id === id && x.how === 'spar')).length;
  const q = encodeURIComponent('bjj ' + t.orig);
  const li = arr => arr.map(x => `<li>${esc(x)}</li>`).join('');
  return `<div class="row small" style="flex-wrap:wrap"><a href="#map" style="text-decoration:none">Карта</a><span class="muted">/</span><a href="#pos-${from.id}" style="text-decoration:none">${esc(from.ru)}</a></div>
  <div class="stack" style="gap:8px">
    <div class="row" style="gap:8px"><span class="ptype" style="--c:var(--t-${t.type})">${TYPES[t.type][0]}</span>${tagLabel(t.tag)}</div>
    <h1 class="h1">${esc(t.ru)}</h1><div class="muted">${esc(t.orig)}</div>
    <div class="path"><a class="p" href="#pos-${from.id}">${esc(from.ru)}</a><span class="ar">→</span>${t.to === 'sub' ? '<span class="p fin">сдача</span>' : `<a class="p" href="#pos-${to.id}">${esc(to.ru)}</a>`}</div>
  </div>
  <div class="tech2">
    <div class="stack" style="gap:16px">
      <section class="card stack"><b>Мой статус</b>
        <div class="seg block" role="group" aria-label="Статус приёма">${LEVELS.map((n, i) => `<button type="button" data-act="setlv" data-id="${id}" data-v="${i}" aria-pressed="${l === i}">${n}</button>`).join('')}</div></section>
      ${h ? `<section class="card stack"><div class="between" style="flex-wrap:wrap"><h2 class="h2">Как делать</h2><span class="tiny">черновик, сверь с тренером</span></div>
          <p style="margin:0">${esc(h.summary)}</p><ol class="steps">${li(h.steps)}</ol></section>
        <div class="grid-auto" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
          <section class="card stack"><h2 class="h2">Ключевые детали</h2><ul class="bul">${li(h.details)}</ul></section>
          <section class="card stack"><h2 class="h2">Частые ошибки</h2><ul class="bul warn">${li(h.mistakes)}</ul></section></div>`
        : `<section class="card stack"><h2 class="h2">Как делать</h2><p class="empty" style="margin:0">Разбора этого приёма пока нет. Посмотри видео и запиши шаги в заметках своими словами: так запоминается лучше.</p></section>`}
      <label class="stack" for="tnote" style="gap:6px"><span class="h2">Мои заметки</span><textarea id="tnote" data-tech="${id}" placeholder="Детали от тренера, свои шаги, что не получается" style="min-height:120px">${esc(st.tnote(id))}</textarea></label>
    </div>
    <div class="stack" style="gap:16px">
      <section class="card stack"><h2 class="h2">Видео и разборы</h2>
        <a class="list-link" style="padding:10px 0" href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener"><span>Видео на YouTube</span><span class="muted">↗</span></a>
        <a class="list-link" style="padding:10px 0" href="https://www.google.com/search?q=${encodeURIComponent(t.orig + ' bjj technique')}" target="_blank" rel="noopener"><span>Статьи с разбором</span><span class="muted">↗</span></a>
        <span class="tiny">Поиск по английскому названию: «${esc(t.orig)}»</span></section>
      <section class="card stack"><h2 class="h2">На тренировках</h2>
        ${logs.length ? `<span>Отрабатывал ${logs.length} ${plural(logs.length, 'раз', 'раза', 'раз')}${spar ? `, в спарринге ${spar}` : ''}.</span><span class="small muted">Последний раз: ${fmtDay(logs[0].date)}</span>`
          : '<span class="small muted">Ещё не записывал. Добавь приём в «Новую тренировку», и здесь появится история.</span>'}</section>
      ${next.length ? `<section class="stack"><div class="between"><h2 class="h2">Что дальше</h2><a class="small" href="#pos-${to.id}" style="text-decoration:none">${esc(to.ru)} →</a></div>${next.map(x => techRow(x, 'out')).join('')}</section>` : ''}
      ${alt.length ? `<section class="stack"><h2 class="h2">Ещё ${TYPE_PL[t.type].toLowerCase()} отсюда</h2>${alt.map(x => techRow(x, 'out')).join('')}</section>` : ''}
    </div>
  </div>`;
}

// ---------- роутинг ----------
const view = document.getElementById('view');
const route = () => (location.hash || '#home').slice(1);
const navTab = r => r.startsWith('pos-') || r.startsWith('tech-') || r === 'map' ? 'map' : r.startsWith('train') ? 'train' : r === 'profile' ? 'profile' : 'home';
function render(keepScroll) {
  const r = route(), y = scrollY;
  const active = document.activeElement?.id, caret = document.activeElement?.selectionStart;
  let html;
  if (r.startsWith('pos-')) html = vPos(r.slice(4));
  else if (r.startsWith('tech-')) html = vTech(r.slice(5));
  else if (r === 'map') html = vMap();
  else if (r === 'gaps') html = vGaps();
  else if (r === 'chain-new') html = vChainNew();
  else if (r === 'train') html = vTrain();
  else if (r === 'train-new') html = vTrainNew();
  else if (r === 'profile') html = vProfile();
  else html = vHome();
  view.innerHTML = `<div class="wrap">${html}</div>`;
  const tab = navTab(r);
  const links = NAV.map(([k, n]) => `<a href="#${k}" ${k === tab ? 'aria-current="page"' : ''}>${icon(k)}${n}</a>`).join('');
  document.getElementById('tabbar').innerHTML = links;
  document.getElementById('side').innerHTML = `<span class="brand">Карта связок</span>${links}${modeSeg()}`;
  if (r === 'map') fillMapSearch();
  if (r === 'train-new') fillTechSearch();
  if (keepScroll) scrollTo(0, y);
  if (active && ['mq', 'tq', 'pnote', 'tnote', 'cname', 'pname', 'pgym', 'snote'].includes(active)) {
    const el = document.getElementById(active); if (el) { el.focus(); try { el.setSelectionRange(caret, caret) } catch {} }
  }
}
let toastT;
function toast(m) { const t = document.getElementById('toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 1800) }

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, id = b.dataset.id, v = b.dataset.v;
  if (a === 'cycle') { st.setLv(id, (lv(id) + 1) % 4); render(true) }
  else if (a === 'setlv') { st.setLv(id, Number(v)); render(true) }
  else if (a === 'mode') { st.setMode(v); render(true) }
  else if (a === 'mgroup') { mGroup = v; render(true) }
  else if (a === 'ptab') { posTab = v; render(true) }
  else if (a === 'chain-add') { draftChain.steps.push(id); render(true) }
  else if (a === 'chain-undo') { draftChain.steps.pop(); render(true) }
  else if (a === 'chain-save') {
    const c = draftChain; if (!c.steps.length) return;
    const last = TMAP[c.steps.at(-1)];
    st.addChain({ name: c.name.trim() || `${PMAP[c.start].ru} → ${last.ru}`, start: c.start, steps: c.steps });
    draftChain = null; location.hash = '#home'; toast('Связка сохранена');
  }
  else if (a === 'del-chain') { st.delChain(id); render(true); toast('Связка удалена') }
  else if (a === 'skind') { draftS.kind = v; render(true) }
  else if (a === 'sadd') { draftS.techs.push({ id, how: 'drill' }); tq = ''; render(true); document.getElementById('tq')?.focus() }
  else if (a === 'srm') { draftS.techs = draftS.techs.filter(x => x.id !== id); render(true) }
  else if (a === 'how') { const x = draftS.techs.find(x => x.id === id); if (x) x.how = v; render(true) }
  else if (a === 'ssave') {
    const d = draftS;
    d.techs.forEach(x => { if (x.how === 'spar') st.setLv(x.id, 3); else if (!lv(x.id)) st.setLv(x.id, 1) });
    st.addSession({ date: d.date || isoDay(new Date()), kind: d.kind, dur: d.dur, techs: d.techs, note: d.note.trim() });
    draftS = null; location.hash = '#train'; toast('Тренировка записана');
  }
  else if (a === 'del-session') { st.delSession(id); render(true); toast('Тренировка удалена') }
  else if (a === 'copy') {
    const ta = document.getElementById('exp');
    const fb = () => { ta.focus(); ta.select(); toast('Код выделен, скопируй его вручную') };
    try { navigator.clipboard.writeText(ta.value).then(() => toast('Код скопирован'), fb) } catch { fb() }
  }
  else if (a === 'import') {
    try { const n = st.importCode(document.getElementById('imp').value); render(); toast('Загружено отметок: ' + n) }
    catch { document.getElementById('impmsg').textContent = 'Не похоже на код прогресса. Скопируй его целиком на другом устройстве.' }
  }
  else if (a === 'reset') { resetAsk = true; render(true) }
  else if (a === 'reset-no') { resetAsk = false; render(true) }
  else if (a === 'reset-yes') { st.resetAll(); resetAsk = false; render(); toast('Всё удалено') }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'mq') { mq = t.value; fillMapSearch() }
  else if (t.id === 'tq') { tq = t.value; fillTechSearch() }
  else if (t.id === 'pnote') st.setNote(t.dataset.pos, t.value)
  else if (t.id === 'tnote') st.setTnote(t.dataset.tech, t.value)
  else if (t.id === 'cname') draftChain.name = t.value;
  else if (t.id === 'sdur') draftS.dur = t.value;
  else if (t.id === 'snote') draftS.note = t.value;
  else if (t.id === 'pname') st.setProfile({ name: t.value });
  else if (t.id === 'pgym') st.setProfile({ gym: t.value });
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'cstart') { draftChain.start = t.value; draftChain.steps = []; render(true) }
  else if (t.id === 'sdate') draftS.date = t.value;
  else if (t.id === 'pbelt') { st.setProfile({ belt: t.value }); render(true) }
  else if (t.id === 'pstr') { st.setProfile({ stripes: Number(t.value) }); render(true) }
});
window.addEventListener('hashchange', () => { if (route() !== 'train-new') draftS = null; render(); scrollTo(0, 0) });

render();
