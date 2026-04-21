import { comparisonColumns, comparisonRows, type ComparisonCell } from '../data/siteContent'
import { useLocale } from '../i18n'
import { ScrollReveal } from './ScrollReveal'

function ComparisonValue({ cell }: { cell: ComparisonCell }) {
  const { t } = useLocale()

  return (
    <span className={`comparison-chip comparison-chip--${cell.kind}`}>
      <span className="comparison-chip__dot" aria-hidden="true" />
      {t(cell.label)}
    </span>
  )
}

export function ComparisonTable() {
  const { t } = useLocale()

  return (
    <ScrollReveal className="comparison-table scroll-reveal--section" delay={120}>
      <div className="comparison-table__header">
        <p className="comparison-table__eyebrow">{t('Category comparison')}</p>
        <p className="comparison-table__intro">
          {t(
            'Representative product categories, not vendor-by-vendor spec claims. The point is how Loreline is positioned and what kind of creative work it is built to hold.',
          )}
        </p>
      </div>

      <div className="comparison-table__wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">{t('Capability')}</th>
              {comparisonColumns.map((column) => (
                <th className={column.featured ? 'comparison-table__featured' : undefined} key={column.id} scope="col">
                  {t(column.label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{t(row.label)}</th>
                {comparisonColumns.map((column) => (
                  <td className={column.featured ? 'comparison-table__featured' : undefined} key={column.id}>
                    <ComparisonValue cell={row.values[column.id]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ScrollReveal>
  )
}
