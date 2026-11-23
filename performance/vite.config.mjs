import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [{
    name: 'profile-task-items',
    enforce: 'pre',
    transform(code, id) {
      if (!id.replaceAll('\\', '/').endsWith('/src/components/TaskItem.tsx')) return;
      return `import { Profiler as ItemProfiler, type ComponentProps as ItemProps } from 'react';\n`
        + code.replace('export default function TaskItem', 'function TaskItem')
        + `\nexport default function ProfiledItem(props: ItemProps<typeof TaskItem>) {
          return <ItemProfiler id={String(props.task.id)} onRender={() => {
            const output = document.getElementById('profile-items');
            if (output) {
              const count = Number(output.dataset.commits || 0) + 1;
              output.dataset.commits = String(count);
              output.textContent = 'Commits de TaskItem: ' + count;
            }
          }}><TaskItem {...props} /></ItemProfiler>;
        }`;
    },
  }, react()],
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
    fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] },
  },
  build: { outDir: '../dist/performance' },
});
