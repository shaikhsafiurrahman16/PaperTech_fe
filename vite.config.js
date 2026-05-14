import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

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
