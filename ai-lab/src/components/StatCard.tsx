interface StatCardProps {
  label: string
  value: string
  accent?: string
}

export const StatCard = ({ label, value, accent }: StatCardProps) => (
  <div className="stat-card" style={accent ? { borderColor: accent } : undefined}>
    <span className="stat-card__label">{label}</span>
    <strong className="stat-card__value">{value}</strong>
  </div>
)
