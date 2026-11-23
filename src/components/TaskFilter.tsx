import { SegmentedControl, SegmentedControlIndicator, SegmentedControlItem } from '@ui-sdk/react/segmented-control';
import { TASK_FILTER_OPTIONS, type TaskFilter as Filter } from '../lib/taskFilter';

interface Props {
  value: Filter;
  onChange: (filter: Filter) => void;
}

/** Segmented control: Todas / Pendientes / Completadas. Local state only. */
export default function TaskFilter({ value, onChange }: Props) {
  return (
    <SegmentedControl
      aria-label="Filtrar tareas"
      value={value}
      onValueChange={next => { if (next) onChange(next as Filter); }}
      className="mb-4 flex w-full"
    >
      <SegmentedControlIndicator />
      {TASK_FILTER_OPTIONS.map(option => (
        <SegmentedControlItem key={option.value} value={option.value} className="flex-1">
          {option.label}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}
