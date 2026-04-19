interface TagPillProps {
  label: string
  accent?: string
  muted?: boolean
}

export const TagPill = ({ label, accent, muted = false }: TagPillProps) => (
  <span
    className={`tag-pill${muted ? ' tag-pill--muted' : ''}`}
    style={accent ? { borderColor: accent, color: accent } : undefined}
  >
    {label}
  </span>
)
