import 'dotenv/config';
import express from 'express'; import helmet from 'helmet'; import cors from 'cors';
import rateLimit from 'express-rate-limit'; import pg from 'pg'; import { createClient } from 'redis';
import mongoose from 'mongoose'; import bcrypt from 'bcryptjs'; import jwt from 'jsonwebtoken';

const { PORT = 4000, JWT_SECRET, CORS_ORIGIN, PG_URL, MONGO_URL, REDIS_URL } = process.env;
if (!JWT_SECRET || JWT_SECRET.length < 16) throw new Error('Set a long JWT_SECRET');

const db = new pg.Pool({ connectionString: PG_URL });            // SQL: PostgreSQL
const redis = createClient({ url: REDIS_URL }); redis.on('error', e => console.error('redis', e.message));
await redis.connect();                                           // cache: Redis
await mongoose.connect(MONGO_URL);                               // NoSQL: MongoDB
const wishSchema = new mongoose.Schema({ userId: Number, sneakerId: Number }, { timestamps: true });
wishSchema.index({ userId: 1, sneakerId: 1 }, { unique: true });
const Wish = mongoose.model('Wish', wishSchema);

const app = express();
app.use(helmet());                                               // OWASP: secure headers
app.use(cors({ origin: CORS_ORIGIN }));                          // OWASP: restrict origins
app.use(express.json({ limit: '10kb' }));
app.use('/api/', rateLimit({ windowMs: 60_000, limit: 120 }));   // OWASP: brute force / DoS
const authLimit = rateLimit({ windowMs: 15 * 60_000, limit: 20 });

const sign = u => jwt.sign({ sub: u.id }, JWT_SECRET, { expiresIn: '2h' });
const auth = (req, res, next) => {
  try { req.uid = Number(jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), JWT_SECRET).sub); next(); }
  catch { res.status(401).json({ error: 'Invalid or missing token' }); }
};
const validCreds = ({ email, password } = {}) => typeof email === 'string' && /^\S+@\S+\.\S+$/.test(email) && typeof password === 'string' && password.length >= 8;

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.get('/api/sneakers', async (req, res) => {                  // REST: GET collection, cached 60s
  const { brand, status } = req.query, key = `sneakers:${brand || ''}:${status || ''}`;
  const hit = await redis.get(key); if (hit) return res.set('X-Cache', 'HIT').json(JSON.parse(hit));
  const where = [], args = [];
  if (['Nike', 'Jordan'].includes(brand)) { args.push(brand); where.push(`brand=$${args.length}`); }
  if (['released', 'upcoming'].includes(status)) { args.push(status); where.push(`status=$${args.length}`); }
  const { rows } = await db.query(`SELECT * FROM (SELECT id, brand, name, colorway, to_char(release_date,'YYYY-MM-DD') AS release_date, price_usd, accent, CASE WHEN release_date > CURRENT_DATE THEN 'upcoming' ELSE 'released' END AS status FROM sneakers) t ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY release_date`, args); // parameterized: no SQL injection
  await redis.set(key, JSON.stringify(rows), { EX: 60 });
  res.set('X-Cache', 'MISS').json(rows);
});

app.post('/api/auth/register', authLimit, async (req, res) => {  // REST: POST creates
  if (!validCreds(req.body)) return res.status(400).json({ error: 'Valid email and 8+ char password required' });
  try {
    const hash = await bcrypt.hash(req.body.password, 12);
    const { rows: [u] } = await db.query('INSERT INTO users (email,password_hash) VALUES ($1,$2) RETURNING id', [req.body.email.toLowerCase(), hash]);
    res.status(201).json({ token: sign(u) });
  } catch (e) { res.status(e.code === '23505' ? 409 : 500).json({ error: e.code === '23505' ? 'Email already registered' : 'Server error' }); }
});

app.post('/api/auth/login', authLimit, async (req, res) => {
  if (!validCreds(req.body)) return res.status(400).json({ error: 'Invalid credentials' });
  const { rows: [u] } = await db.query('SELECT * FROM users WHERE email=$1', [req.body.email.toLowerCase()]);
  if (!u || !(await bcrypt.compare(req.body.password, u.password_hash))) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: sign(u) });
});

app.get('/api/wishlist', auth, async (req, res) => res.json(await Wish.find({ userId: req.uid }).lean()));
app.put('/api/wishlist/:id', auth, async (req, res) => {         // REST: PUT is idempotent
  await Wish.updateOne({ userId: req.uid, sneakerId: Number(req.params.id) }, {}, { upsert: true }); res.status(204).end();
});
app.delete('/api/wishlist/:id', auth, async (req, res) => { await Wish.deleteOne({ userId: req.uid, sneakerId: Number(req.params.id) }); res.status(204).end(); });

app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Server error' }); });
app.listen(PORT, () => console.log(`API on :${PORT}`));
