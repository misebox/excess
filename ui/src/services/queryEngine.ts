import { Table, View } from '../models/types'

export class QueryEngine {
  private tables: Map<string, Table> = new Map()

  setTables(tables: Table[]) {
    this.tables.clear()
    tables.forEach(t => this.tables.set(t.title.toLowerCase(), t))
  }

  executeQuery(query: string): { columns: string[], rows: any[], error?: string } {
    try {
      const trimmedQuery = query.trim().toLowerCase()
      
      // Very simple SQL parser - supports basic SELECT, FROM, WHERE, JOIN
      if (!trimmedQuery.startsWith('select')) {
        throw new Error('Only SELECT queries are supported')
      }

      // Parse SELECT clause
      const selectMatch = trimmedQuery.match(/select\s+(.*?)\s+from/s)
      if (!selectMatch) {
        throw new Error('Invalid SELECT statement')
      }
      const selectClause = selectMatch[1].trim()

      // Parse FROM clause
      const fromMatch = trimmedQuery.match(/from\s+(\w+)/i)
      if (!fromMatch) {
        throw new Error('FROM clause is required')
      }
      const tableName = fromMatch[1].toLowerCase()

      // Get the table
      const table = this.tables.get(tableName)
      if (!table) {
        throw new Error(`Table "${tableName}" not found`)
      }

      let resultRows = [...table.rows]
      let resultColumns: string[] = []

      // Parse WHERE clause (optional)
      const whereMatch = trimmedQuery.match(/where\s+(.*?)(?:$|order|group|limit)/s)
      if (whereMatch) {
        const whereClause = whereMatch[1].trim()
        resultRows = this.applyWhere(resultRows, whereClause)
      }

      // Parse JOIN clause (optional)
      const joinMatch = trimmedQuery.match(/join\s+(\w+)\s+on\s+(.*?)(?:\s+where|\s*$)/i)
      if (joinMatch) {
        const joinTableName = joinMatch[1].toLowerCase()
        const joinCondition = joinMatch[2].trim()
        const joinTable = this.tables.get(joinTableName)
        
        if (!joinTable) {
          throw new Error(`Table "${joinTableName}" not found for JOIN`)
        }
        
        resultRows = this.applyJoin(resultRows, joinTable.rows, joinCondition)
      }

      // Parse ORDER BY clause (optional)
      const orderMatch = trimmedQuery.match(/order\s+by\s+(.*?)(?:$|limit)/i)
      if (orderMatch) {
        const orderClause = orderMatch[1].trim()
        resultRows = this.applyOrderBy(resultRows, orderClause)
      }

      // Parse LIMIT clause (optional)
      const limitMatch = trimmedQuery.match(/limit\s+(\d+)/i)
      if (limitMatch) {
        const limit = parseInt(limitMatch[1])
        resultRows = resultRows.slice(0, limit)
      }

      // Process SELECT columns
      if (selectClause === '*') {
        // Get all columns
        if (resultRows.length > 0) {
          resultColumns = Object.keys(resultRows[0])
        } else if (table.columns.length > 0) {
          resultColumns = table.columns.map(c => c.name)
        }
      } else {
        // Parse specific columns
        const columns = selectClause.split(',').map(c => c.trim())
        resultColumns = []
        
        // Process each column (could be expression or alias)
        for (const col of columns) {
          // Handle COUNT, SUM, AVG, etc.
          if (col.includes('(')) {
            const funcMatch = col.match(/(\w+)\((.*?)\)(?:\s+as\s+(\w+))?/i)
            if (funcMatch) {
              const [, func, field, alias] = funcMatch
              const columnName = alias || `${func}(${field})`
              resultColumns.push(columnName)
              
              if (func.toLowerCase() === 'count') {
                const count = field === '*' ? resultRows.length : 
                  resultRows.filter(r => r[field] != null).length
                resultRows = [{ [columnName]: count }]
              } else if (func.toLowerCase() === 'sum') {
                const sum = resultRows.reduce((acc, row) => acc + (Number(row[field]) || 0), 0)
                resultRows = [{ [columnName]: sum }]
              } else if (func.toLowerCase() === 'avg') {
                const validRows = resultRows.filter(r => r[field] != null)
                const sum = validRows.reduce((acc, row) => acc + (Number(row[field]) || 0), 0)
                const avg = validRows.length > 0 ? sum / validRows.length : 0
                resultRows = [{ [columnName]: avg }]
              } else if (func.toLowerCase() === 'max') {
                const max = Math.max(...resultRows.map(r => Number(r[field]) || -Infinity))
                resultRows = [{ [columnName]: max === -Infinity ? null : max }]
              } else if (func.toLowerCase() === 'min') {
                const min = Math.min(...resultRows.map(r => Number(r[field]) || Infinity))
                resultRows = [{ [columnName]: min === Infinity ? null : min }]
              }
            }
          } else {
            // Handle column aliases (col AS alias)
            const aliasMatch = col.match(/(\w+)(?:\s+as\s+(\w+))?/i)
            if (aliasMatch) {
              const [, fieldName, alias] = aliasMatch
              const columnName = alias || fieldName
              resultColumns.push(columnName)
              
              if (alias) {
                // Rename column in results
                resultRows = resultRows.map(row => ({
                  ...row,
                  [columnName]: row[fieldName]
                }))
              }
            }
          }
        }
        
        // Filter to only selected columns
        if (!selectClause.includes('(')) {
          resultRows = resultRows.map(row => {
            const newRow: any = {}
            for (const col of resultColumns) {
              newRow[col] = row[col]
            }
            return newRow
          })
        }
      }

      return {
        columns: resultColumns,
        rows: resultRows
      }
    } catch (error) {
      return {
        columns: [],
        rows: [],
        error: error.message
      }
    }
  }

  private applyWhere(rows: any[], whereClause: string): any[] {
    // Simple WHERE parser - supports =, !=, <, >, <=, >=, LIKE, AND, OR
    const conditions = this.parseWhereConditions(whereClause)
    
    return rows.filter(row => {
      return this.evaluateConditions(row, conditions)
    })
  }

  private parseWhereConditions(whereClause: string): any[] {
    const conditions: any[] = []
    
    // Split by AND/OR (simple implementation)
    const parts = whereClause.split(/\s+(and|or)\s+/i)
    
    for (let i = 0; i < parts.length; i += 2) {
      const condition = parts[i].trim()
      const operator = parts[i + 1]?.toLowerCase() || 'and'
      
      // Parse individual condition
      const condMatch = condition.match(/(\w+)\s*(=|!=|<>|<=|>=|<|>|like)\s*(.+)/i)
      if (condMatch) {
        const [, field, op, valueStr] = condMatch
        let value: any = valueStr.trim()
        
        // Remove quotes if present
        if ((value.startsWith("'") && value.endsWith("'")) || 
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1)
        } else if (!isNaN(Number(value))) {
          value = Number(value)
        } else if (value === 'true') {
          value = true
        } else if (value === 'false') {
          value = false
        } else if (value === 'null') {
          value = null
        }
        
        conditions.push({ field, op: op.toLowerCase(), value, connector: operator })
      }
    }
    
    return conditions
  }

  private evaluateConditions(row: any, conditions: any[]): boolean {
    if (conditions.length === 0) return true
    
    let result = true
    let currentConnector = 'and'
    
    for (const cond of conditions) {
      const fieldValue = row[cond.field]
      let condResult = false
      
      switch (cond.op) {
        case '=':
          condResult = fieldValue == cond.value
          break
        case '!=':
        case '<>':
          condResult = fieldValue != cond.value
          break
        case '<':
          condResult = fieldValue < cond.value
          break
        case '>':
          condResult = fieldValue > cond.value
          break
        case '<=':
          condResult = fieldValue <= cond.value
          break
        case '>=':
          condResult = fieldValue >= cond.value
          break
        case 'like':
          const pattern = cond.value.replace(/%/g, '.*')
          condResult = new RegExp(pattern, 'i').test(String(fieldValue))
          break
      }
      
      if (currentConnector === 'and') {
        result = result && condResult
      } else if (currentConnector === 'or') {
        result = result || condResult
      }
      
      currentConnector = cond.connector
    }
    
    return result
  }

  private applyJoin(leftRows: any[], rightRows: any[], condition: string): any[] {
    // Parse join condition (e.g., "table1.id = table2.id")
    const condMatch = condition.match(/(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i)
    if (!condMatch) {
      // Simple condition without table prefixes
      const simpleMatch = condition.match(/(\w+)\s*=\s*(\w+)/i)
      if (simpleMatch) {
        const [, leftField, rightField] = simpleMatch
        const result: any[] = []
        
        for (const leftRow of leftRows) {
          for (const rightRow of rightRows) {
            if (leftRow[leftField] == rightRow[rightField]) {
              result.push({ ...leftRow, ...rightRow })
            }
          }
        }
        return result
      }
    }
    
    return leftRows
  }

  private applyOrderBy(rows: any[], orderClause: string): any[] {
    // Parse ORDER BY clause (e.g., "column ASC" or "column DESC")
    const orderMatch = orderClause.match(/(\w+)(?:\s+(asc|desc))?/i)
    if (!orderMatch) return rows
    
    const [, field, direction = 'asc'] = orderMatch
    const isAsc = direction.toLowerCase() === 'asc'
    
    return [...rows].sort((a, b) => {
      const aVal = a[field]
      const bVal = b[field]
      
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return isAsc ? -1 : 1
      if (bVal == null) return isAsc ? 1 : -1
      
      if (aVal < bVal) return isAsc ? -1 : 1
      if (aVal > bVal) return isAsc ? 1 : -1
      return 0
    })
  }

  // Helper function to get available tables for autocomplete
  getAvailableTables(): string[] {
    return Array.from(this.tables.keys())
  }

  // Helper function to get columns for a table
  getTableColumns(tableName: string): string[] {
    const table = this.tables.get(tableName.toLowerCase())
    if (!table) return []
    return table.columns.map(c => c.name)
  }
}

export const queryEngine = new QueryEngine()