import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
  return c.html('<h1>Inksight</h1><p>Hello, World!</p>');
});

export default app;
