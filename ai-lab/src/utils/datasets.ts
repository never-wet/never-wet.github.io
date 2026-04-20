import type { DatasetRecord, TrainingTaskType } from '../memory/types'

type FieldKind = 'number' | 'string'

export interface ImportedDatasetDraft {
  title: string
  schema: string[]
  rows: Array<Record<string, number | string>>
  fieldKinds: Record<string, FieldKind>
  suggestedTargetField: string
  suggestedTaskType: Extract<TrainingTaskType, 'binary-classification' | 'regression'>
}

const createId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`

const coerceCellValue = (value: unknown): number | string => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (!trimmed) {
      return ''
    }

    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : trimmed
  }

  return String(value ?? '')
}

const inferFieldKind = (rows: Array<Record<string, number | string>>, field: string): FieldKind => {
  const numericValues = rows
    .map((row) => row[field])
    .filter((value) => value !== '' && value !== undefined && value !== null)

  if (
    numericValues.length > 0 &&
    numericValues.every((value) => typeof value === 'number' && Number.isFinite(value))
  ) {
    return 'number'
  }

  return 'string'
}

const parseCsvLine = (line: string) => {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]

    if (character === '"') {
      const next = line[index + 1]

      if (inQuotes && next === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }

      continue
    }

    if (character === ',' && !inQuotes) {
      cells.push(current)
      current = ''
      continue
    }

    current += character
  }

  cells.push(current)
  return cells.map((cell) => cell.trim())
}

const parseCsvText = (text: string) => {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw new Error('CSV import needs a header row and at least one data row.')
  }

  const headers = parseCsvLine(lines[0]).map((header) => header || `column_${Math.random().toString(36).slice(2, 5)}`)

  const rows = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line)

    return Object.fromEntries(
      headers.map((header, index) => [header, coerceCellValue(cells[index] ?? '')]),
    )
  })

  return {
    schema: headers,
    rows,
  }
}

const parseJsonText = (text: string) => {
  const parsed = JSON.parse(text) as unknown
  const rows = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && 'rows' in parsed && Array.isArray((parsed as { rows: unknown[] }).rows)
      ? (parsed as { rows: unknown[] }).rows
      : undefined

  if (!rows || rows.length === 0) {
    throw new Error('JSON import expects an array of row objects.')
  }

  const firstRow = rows[0]

  if (!firstRow || typeof firstRow !== 'object' || Array.isArray(firstRow)) {
    throw new Error('JSON rows must be objects with column names as keys.')
  }

  const schema = Object.keys(firstRow as Record<string, unknown>)

  if (schema.length < 2) {
    throw new Error('Imported datasets need at least one feature column and one target column.')
  }

  const normalizedRows = rows.map((row, rowIndex) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error(`Row ${rowIndex + 1} is not a valid object.`)
    }

    return Object.fromEntries(
      schema.map((field) => [field, coerceCellValue((row as Record<string, unknown>)[field])]),
    )
  })

  return {
    schema,
    rows: normalizedRows,
  }
}

const inferSuggestedTaskType = (
  rows: Array<Record<string, number | string>>,
  targetField: string,
): Extract<TrainingTaskType, 'binary-classification' | 'regression'> => {
  const uniqueTargetValues = Array.from(
    new Set(
      rows
        .map((row) => row[targetField])
        .filter((value) => value !== '' && value !== undefined && value !== null)
        .map((value) => String(value)),
    ),
  )

  return uniqueTargetValues.length <= 2 ? 'binary-classification' : 'regression'
}

export const getDefaultPresetIdForTaskType = (
  taskType: TrainingTaskType,
): string => {
  if (taskType === 'regression') {
    return 'sine-lab'
  }

  if (taskType === 'multiclass-classification') {
    return 'spiral-lab'
  }

  return 'xor-lab'
}

export const parseDatasetFile = async (file: File): Promise<ImportedDatasetDraft> => {
  const text = await file.text()
  const extension = file.name.split('.').pop()?.toLowerCase()
  const parsed =
    extension === 'json' ? parseJsonText(text) : parseCsvText(text)

  const fieldKinds = Object.fromEntries(
    parsed.schema.map((field) => [field, inferFieldKind(parsed.rows, field)]),
  ) as Record<string, FieldKind>

  const suggestedTargetField = parsed.schema[parsed.schema.length - 1]

  return {
    title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
    schema: parsed.schema,
    rows: parsed.rows,
    fieldKinds,
    suggestedTargetField,
    suggestedTaskType: inferSuggestedTaskType(parsed.rows, suggestedTargetField),
  }
}

export const buildImportedDatasetRecord = ({
  title,
  draft,
  targetField,
  taskType,
}: {
  title: string
  draft: ImportedDatasetDraft
  targetField: string
  taskType: Extract<TrainingTaskType, 'binary-classification' | 'regression'>
}): DatasetRecord => {
  if (!draft.schema.includes(targetField)) {
    throw new Error('Choose a valid target field before importing the dataset.')
  }

  const featureFields = draft.schema.filter((field) => field !== targetField)

  if (featureFields.length === 0) {
    throw new Error('Imported datasets need at least one feature field.')
  }

  const nonNumericFeature = featureFields.find((field) => draft.fieldKinds[field] !== 'number')

  if (nonNumericFeature) {
    throw new Error(`Feature field "${nonNumericFeature}" must be numeric for browser training.`)
  }

  if (taskType === 'regression' && draft.fieldKinds[targetField] !== 'number') {
    throw new Error('Regression targets must be numeric.')
  }

  const targetValues = draft.rows
    .map((row) => row[targetField])
    .filter((value) => value !== '' && value !== undefined && value !== null)

  const classLabels =
    taskType === 'binary-classification'
      ? Array.from(new Set(targetValues.map((value) => String(value))))
      : undefined

  if (taskType === 'binary-classification' && classLabels?.length !== 2) {
    throw new Error('Binary classification imports need exactly two target classes.')
  }

  if (draft.rows.length < 4) {
    throw new Error('Imported datasets need at least four rows.')
  }

  return {
    id: createId('dataset'),
    title: title.trim() || draft.title,
    description:
      taskType === 'regression'
        ? 'Imported regression dataset for browser training.'
        : 'Imported binary-classification dataset for browser training.',
    tags: ['imported', taskType === 'regression' ? 'regression' : 'binary'],
    source: 'imported',
    taskType,
    schema: draft.schema,
    targetField,
    sampleRows: draft.rows.slice(0, 6),
    rows: draft.rows,
    classLabels,
    presetId: getDefaultPresetIdForTaskType(taskType),
  }
}
