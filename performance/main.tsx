import { Profiler, type ProfilerOnRenderCallback } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import TaskList from '../src/components/TaskList';
import api from '../src/api/client';
import type { Task } from '../src/types/task';

// Isolated fixture: never sends requests, reads credentials or seeds a real DB.
const tasks: Task[] = Array.from({ length: 1000 }, (_, index) => ({
  id: index + 1,
  title: `Tarea de rendimiento ${String(index + 1).padStart(4, '0')}`,
  description: null,
  completed: index % 3 === 0,
  start_date: '2026-11-01',
  end_date: '2026-11-30',
}));
api.interceptors.request.clear();
api.defaults.adapter = async config => {
  if (config.method !== 'get' || config.url !== '/v1/tasks/') {
    throw new Error('Escenario de lectura: solo escribir en el formulario, sin guardar.');
  }
  return { data: tasks, status: 200, statusText: 'OK', headers: {}, config };
};

let commits = 0;
const report: ProfilerOnRenderCallback = (_id, phase, actualDuration) => {
  // No state updates: instrumentation must not cause additional React renders.
  const output = document.getElementById('profile-output');
  if (output) output.textContent = `Commits del árbol: ${++commits}; fase: ${phase}; último: ${actualDuration.toFixed(2)} ms`;
};

createRoot(document.getElementById('root')!).render(
  <main className="container py-4">
    <h1>PERF-06: escenario aislado</h1>
    <p>1,000 tareas ficticias. Escribe en Nueva tarea sin guardar. Usa React DevTools Profiler para identificar qué componentes se renderizan.</p>
    <p id="profile-output" aria-live="off" />
    <Profiler id="TaskList-1000" onRender={report}><TaskList /></Profiler>
  </main>,
);
