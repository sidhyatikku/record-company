import { SHELF_VIEWS, type ShelfView } from './views'

type ViewToggleProps = {
  value: ShelfView
  onChange: (view: ShelfView) => void
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="segmented" role="group" aria-label="Collection format">
      {SHELF_VIEWS.map(({ id, label }) => (
        <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </div>
  )
}
