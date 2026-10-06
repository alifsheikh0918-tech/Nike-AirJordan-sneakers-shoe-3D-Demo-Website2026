import { useEffect, useRef, useState } from 'react';

const FALLBACK = [
  { id: 1, brand: 'Jordan', name: 'Air Jordan 1 High OG (sample)', colorway: 'Red / Black', release_date: '2025-03-01', price_usd: 180, status: 'released', accent: '#e0262d' },
  { id: 2, brand: 'Nike', name: 'Air Max 95 (sample)', colorway: 'Neon / Grey', release_date: '2025-06-15', price_usd: 190, status: 'released', accent: '#c6f432' },
  { id: 3, brand: 'Jordan', name: 'Air Jordan 4 (sample)', colorway: 'White / Blue', release_date: '2026-02-14', price_usd: 210, status: 'released', accent: '#2fb8ec' },
];

// Real photo from /public/shoes/<id>.png; falls back to a drawing if the file is missing.
function Shoe({ s, className = '', style, reflect }) {
  const [ok, setOk] = useState(true);
  if (!ok) return (
    <svg viewBox="0 0 400 200" style={style} className={className} role="img" aria-label={s.name}>
      <path d="M20 140 C20 100 60 90 90 80 L140 40 C160 30 180 50 200 60 C230 75 270 75 310 100 C360 115 385 125 385 150 L385 165 L20 165 Z" fill={s.accent} />
      <path d="M20 150 H385 V172 C385 178 380 182 372 182 H33 C25 182 20 178 20 172 Z" fill="#f4f4f5" />
    </svg>
  );
  return (
    <div style={style} className={className}>
      <img src={`/shoes/${s.id}.png`} alt={s.name} onError={() => setOk(false)} draggable={false} className="w-full select-none drop-shadow-[0_30px_35px_rgba(0,0,0,.55)]" />
      {reflect && <img src={`/shoes/${s.id}.png`} alt="" aria-hidden className="floor-reflect -mt-[3%] w-full scale-y-[-1] select-none" />}
    </div>
  );
}

const money = v => (v == null ? 'Price TBA' : `$${v}`);
const meta = s => [s.colorway, s.release_date?.slice(0, 10), money(s.price_usd)].filter(Boolean).join(' · ');
const api = (url, token, opt = {}) => fetch(url, { ...opt, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) } })
  .then(async r => { if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Request failed'); return r.status === 204 ? null : r.json(); });

function Heart({ on, onClick, className = '' }) {
  return (
    <button onClick={onClick} aria-label={on ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={on}
      className={`grid h-10 w-10 place-items-center rounded-full border border-white/30 bg-black/30 backdrop-blur transition hover:scale-110 ${className}`}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill={on ? '#ff3b5c' : 'none'} stroke={on ? '#ff3b5c' : 'white'} strokeWidth="2"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21z" /></svg>
    </button>
  );
}

function AuthModal({ onClose, onToken }) {
  const [mode, setMode] = useState('login'); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault(); setBusy(true); setErr('');
    try { const { token } = await api(`/api/auth/${mode}`, null, { method: 'POST', body: JSON.stringify({ email, password }) }); onToken(token); onClose(); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  const field = 'w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 outline-none focus:border-white/60';
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="w-full max-w-sm space-y-4 rounded-3xl border border-white/15 bg-neutral-900 p-8">
        <h2 className="font-display text-2xl font-extrabold">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
        <input className={field} type="email" required placeholder="Email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className={field} type="password" required minLength={8} placeholder="Password (8+ characters)" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} />
        {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
        <button disabled={busy} className="w-full rounded-full bg-white py-3 font-semibold text-black disabled:opacity-50">{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}</button>
        <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="w-full text-sm opacity-70 hover:opacity-100">{mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}</button>
      </form>
    </div>
  );
}

export default function App() {
  const [shoes, setShoes] = useState(FALLBACK);
  const [filter, setFilter] = useState('all');
  const [p, setP] = useState(0);
  const [m, setM] = useState({ x: 0, y: 0 });
  const stage = useRef(null);
  const [token, setToken] = useState(() => localStorage.getItem('kicks_token'));
  const [wish, setWish] = useState(new Set());
  const [modal, setModal] = useState(false);
  const up = shoes.filter(s => s.status === 'upcoming');
  const hero = (up.length ? up : shoes).slice(0, 6);
  const saveToken = t => { t ? localStorage.setItem('kicks_token', t) : localStorage.removeItem('kicks_token'); setToken(t); };
  useEffect(() => {
    if (!token) { setWish(new Set()); return; }
    api('/api/wishlist', token).then(r => setWish(new Set(r.map(w => w.sneakerId)))).catch(() => saveToken(null));
  }, [token]);
  const toggle = async id => {
    if (!token) return setModal(true);
    const on = wish.has(id);
    try { await api(`/api/wishlist/${id}`, token, { method: on ? 'DELETE' : 'PUT' }); setWish(w => { const n = new Set(w); on ? n.delete(id) : n.add(id); return n; }); }
    catch { saveToken(null); setModal(true); }
  };

  useEffect(() => { fetch('/api/sneakers').then(r => r.ok ? r.json() : Promise.reject()).then(d => d.length && setShoes(d)).catch(() => {}); }, []);
  useEffect(() => {
    const on = () => {
      const el = stage.current; if (!el) return;
      const max = el.offsetHeight - innerHeight;
      setP(Math.min(Math.max(-el.getBoundingClientRect().top / max, 0), 1) * (hero.length - 1));
    };
    on(); addEventListener('scroll', on, { passive: true }); return () => removeEventListener('scroll', on);
  }, [hero.length]);

  const i = Math.min(Math.round(p), hero.length - 1), cur = hero[i];
  const list = shoes.filter(s => filter === 'all' || s.brand === filter || s.status === filter || s.release_date?.startsWith(filter));
  const btn = a => `rounded-full border px-5 py-2 text-sm backdrop-blur transition ${filter === a ? 'bg-white text-black' : 'border-white/30 hover:bg-white/10'}`;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex justify-between px-6 py-5 font-display text-lg font-extrabold mix-blend-difference">KICKS 25/26<span className="flex items-center gap-4 text-sm font-normal">Nike · Jordan<button onClick={() => (token ? saveToken(null) : setModal(true))} className="rounded-full border border-white/60 px-4 py-1.5">{token ? 'Log out' : 'Log in'}</button></span></header>

      <section ref={stage} style={{ height: `${hero.length * 100}vh` }} className="relative">
        <div onMouseMove={e => setM({ x: e.clientX / innerWidth - .5, y: e.clientY / innerHeight - .5 })}
             className="grain sticky top-0 h-screen overflow-hidden bg-[#07070b]">
          {/* background: colour glows follow the active shoe */}
          <div className="absolute inset-0 transition-[background] duration-700" style={{ background: `radial-gradient(55% 45% at 50% 52%, ${cur.accent}cc 0%, ${cur.accent}33 45%, transparent 72%)` }} />
          <div className="absolute -left-[10vw] -top-[10vh] h-[60vh] w-[60vh] animate-[drift_14s_ease-in-out_infinite] rounded-full blur-[90px] transition-colors duration-700" style={{ background: `${cur.accent}55` }} />
          <div className="absolute -bottom-[15vh] -right-[10vw] h-[70vh] w-[70vh] animate-[drift_18s_ease-in-out_infinite_reverse] rounded-full bg-indigo-600/30 blur-[110px]" />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,.75) 100%)' }} />
          <div className="absolute inset-x-0 top-[68%] h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <h1 aria-hidden className="absolute left-0 top-1/2 -translate-y-[58%] whitespace-nowrap font-display text-[30vw] font-extrabold leading-none text-transparent [-webkit-text-stroke:2px_rgba(255,255,255,.18)]"
              style={{ transform: `translate3d(${-p * 14 - m.x * 40}px,-58%,0)` }}>{cur.brand.toUpperCase()}</h1>

          {/* every shoe is stacked; the active one slides to centre and the others fade out */}
          {hero.map((s, n) => {
            const d = n - p, a = Math.max(0, 1 - Math.abs(d) * 1.5);
            return (
              <div key={s.id} className="pointer-events-none absolute left-1/2 top-[44%] z-10 w-[min(92vw,820px)]"
                   style={{ opacity: a, transform: `translate3d(calc(-50% + ${d * 45}vw + ${m.x * -30}px), calc(-50% + ${m.y * -20}px), 0) rotateZ(${-8 - d * 14}deg) scale(${1 + a * .08})`, perspective: 1200 }}>
                <Shoe s={s} reflect className="[transform:rotateY(-14deg)]" />
              </div>
            );
          })}

          <div className="absolute bottom-[7vh] left-6 right-6 z-20 md:left-16 md:max-w-md">
            <p className="text-sm uppercase tracking-widest opacity-70">{cur.status === 'upcoming' ? 'Upcoming' : 'Released'} · {cur.release_date?.slice(0, 10)}</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold md:text-5xl">{cur.name}</h2>
            <div className="mt-3 flex items-center gap-3"><p className="opacity-80">{[cur.colorway, money(cur.price_usd)].filter(Boolean).join(' · ')}</p><Heart on={wish.has(cur.id)} onClick={() => toggle(cur.id)} /></div>
          </div>
          <p className="absolute bottom-[7vh] right-6 z-20 hidden text-sm opacity-60 md:block md:right-16">Scroll ↓ {i + 1} / {hero.length}</p>
        </div>
      </section>

      <main className="relative mx-auto max-w-6xl px-6 py-24">
        <h2 className="mb-6 font-display text-3xl font-extrabold">All releases</h2>
        <div className="mb-8 flex flex-wrap gap-2">
          {[['all', 'All'], ['Nike', 'Nike'], ['Jordan', 'Jordan'], ['upcoming', 'Upcoming'], ['2025', '2025'], ['2026', '2026']].map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={btn(k)}>{l}</button>)}
        </div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(s => (
            <li key={s.id} className="group relative overflow-hidden rounded-3xl border border-white/10 p-5 transition hover:-translate-y-1" style={{ background: `radial-gradient(80% 70% at 50% 35%, ${s.accent}55, #101014 75%)` }}>
              <Heart on={wish.has(s.id)} onClick={() => toggle(s.id)} className="absolute right-4 top-4 z-10" />
              <Shoe s={s} className="transition duration-500 [transform:rotateZ(-8deg)] group-hover:[transform:rotateZ(-4deg)_scale(1.08)]" />
              <h3 className="mt-3 font-display text-lg">{s.name}</h3>
              <p className="text-sm opacity-70">{meta(s)}</p>
            </li>
          ))}
        </ul>
      </main>
      {modal && <AuthModal onClose={() => setModal(false)} onToken={saveToken} />}
    </>
  );
}
