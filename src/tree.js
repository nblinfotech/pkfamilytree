import { D } from './data.js';
export const root = { k: [], l: [] }; const st = [root];
D.split('\n').forEach(s => {
  const m = s.match(/^(\.*)([~@]?)(.*)$/), d = m[1].length, t = m[3].replace(/\*/g, 'Late ');
  if (m[2] === '@') { st[d].cur = t; return }
  if (m[2] === '~') st[d].l.push(...t.split(','));
  else { const n = { t, k: [], l: [] }; if (st[d].cur) n.u = st[d].cur; st[d].k.push(n); st.length = d + 1; st[d + 1] = n }
});
export const ini = s => s.replace(/^Late /, '')[0];
export const cnt = n => n.l.length + n.k.reduce((a, c) => a + 1 + cnt(c), 0);
export const gen = n => 1 + Math.max(n.l.length ? 1 : 0, ...n.k.map(gen), 0);
export const sp = t => { const p = t.split(' & '); return [p[0], p.slice(1).join(' ♥ ')] };
// groups a person's children by the husband/wife they had them with
export const unions = n => {
  const g = [];
  n.k.forEach(x => { if (!x.u) return; let o = g.find(y => y.u === x.u); if (!o) g.push(o = { u: x.u, k: [] }); o.k.push(x) }); return g
};
const has = (s = '', v) => s.toLowerCase().includes(v);
export function prune(n, v) {
  const [a, b] = sp(n.t);
  if (has(a, v) || has(b, v)) return { ...n, _m: 1, _o: n };
  const k = n.k.map(x => x.u && has(x.u, v) ? { ...x, _m: 1, _o: x } : prune(x, v)).filter(Boolean),
    l = n.l.filter(x => has(x, v));
  return k.length || l.length ? { ...n, k, l, _a: 1, _c: cnt(n), _o: n } : null
}