import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3847,
      strictPort: true,
    },
  }),
  manifest: {
    name: 'Daily Learner',
    description:
      'Daily AI learning articles and quizzes powered by your Cursor API key.',
    version: '1.0.0',
    permissions: ['storage', 'alarms', 'sidePanel'],
    host_permissions: ['https://api.cursor.com/*', 'http://*/*', 'https://*/*'],
    action: {
      default_title: 'Open Daily Learner',
    },
  },
});
