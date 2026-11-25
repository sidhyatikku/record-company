export function SectionDivider({ letter }: { letter: string }) {
  return (
    <div className="divider" role="separator" aria-label={`Artists: ${letter}`}>
      <span className="divider-tab">{letter}</span>
    </div>
  )
}
