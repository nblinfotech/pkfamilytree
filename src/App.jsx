import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { root, cnt, gen, sp, prune, unions, ini } from './tree.js';
const G = ['linear-gradient(135deg,#d9a441,#f2d27a)', 'linear-gradient(135deg,#2f9e7a,#7fd6b0)', 'linear-gradient(135deg,#e07a6e,#f6b8a4)', 'linear-gradient(135deg,#5b8ae0,#a9c2f7)', 'linear-gradient(135deg,#a066e0,#d6b0f7)', 'linear-gradient(135deg,#e0a35b,#f7d4a9)'];
const T = ['Payitha ♥ Savaan', 'Umayya ♥ Kuttiyali'];
const ExportCtx = createContext(() => { }), QCtx = createContext('');

const Late = ({ t }) => t.split(/\b(Late)(?=\s|$)/).map((s, i) => i % 2 ? <span key={i} className="late">Late</span> : s);
const Mark = ({ t }) => {
  const v = useContext(QCtx), i = v ? t.toLowerCase().indexOf(v) : -1;
  return i < 0 ? <Late t={t} /> : <><Late t={t.slice(0, i)} /><mark className="hit"><Late t={t.slice(i, i + v.length)} /></mark><Late t={t.slice(i + v.length)} /></>
};
const C = ['#d9a441', '#2f9e7a', '#e07a6e', '#5b8ae0', '#a066e0', '#e0a35b'];
const Av = ({ a, b, g }) => <span className="av2"><i style={{ '--g': G[g % 6] }}>{ini(a)}</i>{b && <i className="s" style={{ '--g': G[(g + 1) % 6] }}>{ini(b)}</i>}</span>;
const Leaves = ({ l, d }) => l.map((x, i) => <li className="leaf" key={i}><span className="chip" style={{ '--g': G[d % 6], '--c': C[d % 6] }}><i>{ini(x)}</i><b><Mark t={x} /></b></span></li>);



function Union({ u, d, all, p }) {
  const v = useContext(QCtx), c = u.k.reduce((s, x) => s + 1 + cnt(x), 0), open = all || v || d < 1;
  return <li><details open={!!open}>
    <summary className="union"><Av a={u.u} g={d + 3} />
      <span className="tx"><span className="nm"><Mark t={u.u} /></span>
        <small className="sp">♥ Married to {p} · {u.k.length} {u.k.length > 1 ? 'children' : 'child'}</small></span>
      <em className="cnt">{c}</em></summary>
    <ul>{u.k.map((x, i) => <Node key={i} n={x} d={d + 1} all={all} />)}</ul></details></li>;
}

function Node({ n, d, all }) {
  const exp = useContext(ExportCtx), v = useContext(QCtx), [a, b0] = sp(n.t), has = n.k.length || n.l.length,
    g = unions(n), b = b0 || g.map(x => x.u).join(' & ');
  const head = (
    <summary className={has ? '' : 'nokids'} style={has ? null : { cursor: 'default', '--c': C[d % 6] }}>
      <Av a={a} b={b} g={d} />
      <span className="tx"><span className="nm"><Mark t={a} /></span>{b && <small className="sp">♥ <Mark t={b} /></small>}</span>
      {has && <em className="cnt">{n._c ?? cnt(n)}</em>}
      {has && !all && <button className="pdf" title={`Export generation ${d + 2} branch to PDF`}
        onClick={e => { e.preventDefault(); e.stopPropagation(); exp(n._o || n, d) }}>⤓ PDF</button>}
    </summary>);
  if (!has) return <li>{head}</li>;
  const open = all || (v ? !!(n._a || n._m) : d < 1);
  return <li><details open={open}>{head}<ul>
    {n.k.filter(x => !x.u).map((x, i) => <Node key={i} n={x} d={d + 1} all={all} />)}
    {g.map(u => <Union key={u.u} u={u} d={d} all={all} p={a} />)}
    <Leaves l={n.l} d={d + 1} /></ul></details></li>;
}

// Print-only view: the chosen node with every generation below it fully expanded
const FILL = ['#f2d27a', '#a9dcc4', '#f6b8a4', '#a9c2f7', '#d6b0f7', '#f7d4a9'];
const CW = 6.6, LH = 15, PAD = 6, GAP = 44, ROW = 8;

const LateSvg = ({ s }) => s.split(/\b(Late)(?=\s|$)/).map((x, i) => i % 2 ? <tspan key={i} fill="#d64545" fontStyle="italic" fontSize="0.75em">Late</tspan> : x);

const wrapNames = l => {
  const o = []; let c = '';
  l.forEach(x => { if (c && (c + ', ' + x).length > 26) { o.push(c + ','); c = x } else c = c ? c + ', ' + x : x });
  o.push(c); return o
};

const build = n => {
  const [a, b0] = sp(n.t), g = unions(n), b = b0 || g.map(x => x.u).join(' & ');
  const lines = [b ? `${a} ♥ ${b}` : a];
  const kids = n.k.filter(x => !x.u).map(build);
  g.forEach(u => kids.push({ lines: ['♥ ' + u.u], kids: u.k.map(build) }));
  if (n.l.length) kids.push({ leaf: 1, lines: wrapNames(n.l), kids: [] });
  return { lines, kids }
};

function Print({ n, d }) {
  const root = build(n), [a, b0] = sp(n.t), b = b0 || unions(n).map(x => x.u).join(' & '), all = [];
  // measure
  (function m(it) {
    it.w = Math.max(...it.lines.map(s => s.length)) * CW + 24;
    it.h = it.lines.length * LH + PAD * 2; all.push(it); it.kids.forEach(m)
  })(root);
  // column positions
  const colW = [];
  (function c(it, dp) { it.d = dp; colW[dp] = Math.max(colW[dp] || 0, it.w); it.kids.forEach(k => c(k, dp + 1)) })(root, 0);
  const X = []; colW.reduce((s, w, i) => (X[i] = s, s + w + GAP), 20);
  // vertical placement
  let cur = 64;
  (function p(it) {
    if (!it.kids.length) { it.y = cur + it.h / 2; cur += it.h + ROW; return }
    it.kids.forEach(p); it.y = (it.kids[0].y + it.kids.at(-1).y) / 2
  })(root);
  const W = X.at(-1) - GAP + colW.at(-1) + 20 - (colW.at(-1) - colW.at(-1)) + 0, H = cur + 12;
  const width = X[X.length - 1] + colW[colW.length - 1] + 20;

  return <div className="print-root">
    <svg viewBox={`0 0 ${width} ${H}`} preserveAspectRatio="xMidYMin meet"
      fontFamily="Poppins,system-ui,sans-serif">
      <text x="20" y="28" fontSize="20" fontWeight="700" fill="#22302a"
        fontFamily="'Playfair Display',Georgia,serif">{a}{b ? ` & ${b}` : ''}</text>
      <text x="20" y="46" fontSize="11" fill="#75806f">
        Generation {d + 2} · {cnt(n)} descendants · {gen(n)} generations</text>
      {all.map((it, i) => it.kids.map((k, j) => {
        const x1 = X[it.d] + it.w, x2 = X[k.d], mx = x2 - GAP / 2;
        return <path key={i + '-' + j} d={`M${x1} ${it.y}H${mx}V${k.y}H${x2}`}
          fill="none" stroke="#b9ab86" strokeWidth="1.3" />
      }))}
      {all.map((it, i) => {
        const x = X[it.d], y = it.y - it.h / 2;
        return <g key={i}>
          <rect x={x} y={y} width={it.w} height={it.h} rx="8"
            fill={FILL[it.d % 6]} fillOpacity={it.leaf ? .3 : .55}
            stroke={it.leaf ? '#b9ab86' : FILL[it.d % 6]} strokeDasharray={it.leaf ? '3 3' : null} />
          {it.lines.map((s, k) => <text key={k} x={x + 12} y={y + PAD + k * LH + 11}
            fontSize={it.leaf ? 10.5 : 12} fontWeight={it.leaf ? 400 : 600} fill="#22302a"><LateSvg s={s} /></text>)}
        </g>
      })}
    </svg>
  </div>;
}

function Fireflies() {
  const ref = useRef();
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const c = ref.current, x = c.getContext('2d');
    let W, H, raf, ff = [], m = { x: -999, y: -999, on: false };
    const isDark = () => { const t = document.documentElement.dataset.theme; return t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme:dark)').matches) };
    const spawn = (px, py, tmp) => ({
      x: px ?? Math.random() * W, y: py ?? Math.random() * H, vx: 0, vy: 0, a: Math.random() * 6.28,
      ph: Math.random() * 6.28, sp: .6 + Math.random() * .8, r: 1.1 + Math.random() * 1.5, life: 1, tmp
    });
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
      c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(46, Math.max(16, W * H / 26000)));
      const base = ff.filter(f => !f.tmp);
      while (base.length < n) base.push(spawn());
      ff = base.slice(0, n).concat(ff.filter(f => f.tmp));
    };
    const move = e => { m.x = e.clientX; m.y = e.clientY; m.on = true };
    const leave = () => { m.on = false };
    const down = e => {
      ff.forEach(f => {
        const dx = f.x - e.clientX, dy = f.y - e.clientY, d = Math.hypot(dx, dy);
        if (d < 240 && d > 1) { f.vx += dx / d * 5; f.vy += dy / d * 5 }
      });
      for (let i = 0; i < 7 && ff.length < 90; i++) {
        const s = spawn(e.clientX, e.clientY, true), a = Math.random() * 6.28, v = 1.5 + Math.random() * 2.5;
        s.vx = Math.cos(a) * v; s.vy = Math.sin(a) * v; s.r = .9 + Math.random() * .9; ff.push(s)
      }
    };
    const tick = t => {
      x.clearRect(0, 0, W, H);
      const d = isDark(), col = d ? '255,226,130' : '214,150,30';
      x.globalCompositeOperation = d ? 'lighter' : 'source-over';
      ff = ff.filter(f => f.life > 0);
      ff.forEach(f => {
        f.a += (Math.random() - .5) * .3;
        f.vx += Math.cos(f.a) * .02 * f.sp; f.vy += Math.sin(f.a) * .02 * f.sp - .002;
        if (m.on) {
          const dx = m.x - f.x, dy = m.y - f.y, dist = Math.hypot(dx, dy);
          if (dist < 200 && dist > 1) { const k = dist > 60 ? .05 : -.07; f.vx += dx / dist * k; f.vy += dy / dist * k }
        }
        f.vx *= .97; f.vy *= .97;
        const sp = Math.hypot(f.vx, f.vy); if (sp > 4) { f.vx *= 4 / sp; f.vy *= 4 / sp }
        f.x += f.vx; f.y += f.vy;
        if (f.x < -30) f.x = W + 30; else if (f.x > W + 30) f.x = -30;
        if (f.y < -30) f.y = H + 30; else if (f.y > H + 30) f.y = -30;
        if (f.tmp) f.life -= .012;
        const glow = .5 + .5 * Math.sin(t / (520 / f.sp) + f.ph), R = f.r * (5 + glow * 5) * (f.tmp ? 1 : 1),
          al = glow * f.life * (d ? 1 : .8);
        const g = x.createRadialGradient(f.x, f.y, 0, f.x, f.y, R);
        g.addColorStop(0, `rgba(${col},${.95 * al})`); g.addColorStop(.3, `rgba(${col},${.32 * al})`); g.addColorStop(1, `rgba(${col},0)`);
        x.fillStyle = g; x.beginPath(); x.arc(f.x, f.y, R, 0, 6.283); x.fill();
      });
      raf = requestAnimationFrame(tick);
    };
    size(); raf = requestAnimationFrame(tick);
    addEventListener('resize', size); addEventListener('pointermove', move);
    addEventListener('pointerdown', down); document.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf); removeEventListener('resize', size); removeEventListener('pointermove', move);
      removeEventListener('pointerdown', down); document.removeEventListener('pointerleave', leave)
    };
  }, []);
  return <canvas ref={ref} className="ff" aria-hidden="true" />;
}

export default function App() {
  const [tab, setTab] = useState(0), [q, setQ] = useState(''), [pr, setPr] = useState(null), ref = useRef();
  const v = q.trim().toLowerCase();
  const trees = root.k.map(n => v ? prune(n, v) : n);
  const cur = trees[tab] ? tab : Math.max(0, trees.findIndex(Boolean)), t = trees[cur];
  const full = root.k[cur], [fa, fb] = sp(full.t);

  useEffect(() => {
    if (!pr) return;
    const old = document.title, [a] = sp(pr.n.t); document.title = `${a} – family branch`;
    const done = () => { setPr(null); document.title = old };
    window.addEventListener('afterprint', done, { once: true });
    const id = setTimeout(() => window.print(), 200);
    return () => clearTimeout(id)
  }, [pr]);

  const setAll = o => ref.current?.querySelectorAll('details').forEach(d => d.open = o);
  const stats = [['Descendants', root.k.reduce((a, n) => a + cnt(n), 0)], ['Generations', Math.max(...root.k.map(gen)) + 1], ['Branches', root.k.length]];

  return <QCtx.Provider value={v}><ExportCtx.Provider value={(n, d) => setPr({ n, d })}>
    <Fireflies />
    <div className="screen">
      <div className="hero"><small>THE DESCENDANTS OF</small><h1>Pallikandy Family</h1><div className="orn">❦ ❦ ❦</div>
        <div className="stats">{stats.map(([l, n]) => <div key={l}><b>{n}</b><span>{l}</span></div>)}</div></div>
      <div className="bar">
        <div className="tabs">{T.map((x, i) => <button key={i} className={i === cur ? 'on' : ''} onClick={() => setTab(i)}>{x}</button>)}</div>
        <div className="tools"><input type="search" placeholder="Search a name…" value={q} onChange={e => setQ(e.target.value)} />
          <button onClick={() => setAll(true)}>Expand</button><button onClick={() => setAll(false)}>Collapse</button></div>
      </div>
      <main ref={ref}>
        {t ? <section className="sec on">
          <div className="fd"><Av a={fa} b={fb} g={cur} /><div><h2>{fa} &amp; {fb}</h2><p>{cnt(full)} descendants · {gen(full)} generations</p></div>
            <button className="pdf" onClick={() => setPr({ n: full, d: -1 })}>⤓ Export branch</button></div>
          <ul>{t.k.map((x, i) => <Node key={v + i} n={x} d={0} />)}</ul>
        </section> : <p className="note">No matching names found</p>}
      </main>
      <p className="note">Tap a name to open or close its branch · ⤓ PDF exports that branch fully expanded</p>
    </div>
    {pr && <Print n={pr.n} d={pr.d} />}
  </ExportCtx.Provider></QCtx.Provider>;
}
