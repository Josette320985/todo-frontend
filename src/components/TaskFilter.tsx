import { ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import { TASK_FILTER_OPTIONS, type TaskFilter as Filter } from '../lib/taskFilter';

interface Props {
  value: Filter;
  onChange: (filter: Filter) => void;
}

/** Segmented control: Todas / Pendientes / Completadas. Local state only. */
export default function TaskFilter({ value, onChange }: Props) {
  return (
    <ToggleButtonGroup
      type="radio"
      name="task-filter"
      value={value}
      onChange={(next: Filter) => onChange(next)}
      className="w-100 mb-3"
      aria-label="Filtrar tareas"
    >
      {TASK_FILTER_OPTIONS.map(option => (
        <ToggleButton
          key={option.value}
          id={`task-filter-${option.value}`}
          value={option.value}
          variant="outline-primary"
          size="sm"
        >
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}