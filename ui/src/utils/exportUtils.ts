import { Table } from '../models/types'

export const exportToCSV = (table: Table, includeHeaders: boolean = true): string => {
  const rows: string[] = []
  
  // Add headers
  if (includeHeaders) {
    const headers = table.columns.map(col => escapeCSV(col.name))
    rows.push(headers.join(','))
  }
  
  // Add data rows
  table.rows.forEach(row => {
    const values = table.columns.map(col => {
      const value = row[col.name]
      return escapeCSV(formatValue(value))
    })
    rows.push(values.join(','))
  })
  
  return rows.join('\n')
}

export const exportToTSV = (table: Table, includeHeaders: boolean = true): string => {
  const rows: string[] = []
  
  // Add headers
  if (includeHeaders) {
    const headers = table.columns.map(col => col.name)
    rows.push(headers.join('\t'))
  }
  
  // Add data rows
  table.rows.forEach(row => {
    const values = table.columns.map(col => {
      const value = row[col.name]
      return formatValue(value)
    })
    rows.push(values.join('\t'))
  })
  
  return rows.join('\n')
}

export const exportToJSON = (table: Table): string => {
  return JSON.stringify({
    title: table.title,
    columns: table.columns,
    rows: table.rows,
    primaryKey: table.primaryKey,
    uniqueConstraints: table.uniqueConstraints,
    indexes: table.indexes
  }, null, 2)
}

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const escapeCSV = (value: string): string => {
  if (value === null || value === undefined) return ''
  const str = String(value)
  
  // Escape if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const formatValue = (value: any): string => {
  if (value === null) return 'null'
  if (value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}