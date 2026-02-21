import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
  STORAGE: R2Bucket;
  KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

app.get('/', (c) => {
  return c.json({ 
    name: 'Inksight API',
    version: '1.0.0',
    status: 'operational'
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'healthy' });
});

// Email endpoints
app.get('/emails', async (c) => {
  const userId = c.req.header('X-User-ID');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM emails WHERE user_id = ? ORDER BY received_date DESC LIMIT 50'
  ).bind(userId).all();

  return c.json({ emails: results });
});

// Financial endpoints
app.get('/finance', async (c) => {
  const userId = c.req.header('X-User-ID');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM finance WHERE user_id = ? ORDER BY transaction_date DESC LIMIT 100'
  ).bind(userId).all();

  return c.json({ transactions: results });
});

// Search endpoint
app.post('/search', async (c) => {
  const userId = c.req.header('X-User-ID');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const { query } = await c.req.json();
  
  // TODO: Implement vector search
  return c.json({ results: [] });
});

export default app;
