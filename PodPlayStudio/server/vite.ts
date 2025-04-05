import express from 'express';
import { createServer } from 'vite';
import { resolve } from 'path';

export const createViteDevServer = async (app: express.Express) => {
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: resolve(process.cwd()),
  });

  app.use(vite.middlewares);
  return vite;
};