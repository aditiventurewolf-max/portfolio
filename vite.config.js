import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 4000, host: 'localhost' },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        learnings: 'learnings.html',
      },
    },
  },
});
