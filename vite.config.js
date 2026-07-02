import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

export default ({ mode }) => {
  const projectRoot = path.dirname(fileURLToPath(import.meta.url));
  const env = loadEnv(mode, projectRoot, '');

  return defineConfig({
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_PORT) || parseInt(env.PORT) || 3000,
    },
    preview: {
      port: parseInt(env.VITE_PREVIEW_PORT) || 4173,
    },
  });
};
