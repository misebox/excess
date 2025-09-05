import { Table, View, AppFunction } from '../models/types'
import { secureFunctionEngine } from './secureFunctionEngine'

export class QueryEngine {
  private tables: Map<string, Table> = new Map()
  private functions: Map<string, AppFunction> = new Map()

  setTables(tables: Table[]) {
    this.tables.clear()
    tables.forEach(t => this.tables.set(t.title.toLowerCase(), t))
  }

  setFunctions(functions: AppFunction[]) {
    this.functions.clear()
    functions.forEach(f => this.functions.set(f.name.toLowerCase(), f))
  }

  executeQuery(query: string): { columns: string[], rows: any[], error?: string } {
    try {
      const trimmedQuery = query.trim().toLowerCase()
      const originalQuery = query.trim()
      
      // Very simple SQL parser - supports basic SELECT, FROM, WHERE, JOIN
      if (!trimmedQuery.startsWith('select')) {
        throw new Error(`Line 1: Only SELECT queries are supported. Found: "${originalQuery.substring(0, 20)}..."`)
      }

      // Parse SELECT clause
      const selectMatch = trimmedQuery.match(/select\s+(.*?)\s+from/s)
      if (!selectMatch) {
        throw new Error('Invalid SELECT statement. Syntax: SELECT columns FROM table')
      }
      const selectClause = selectMatch[1].trim()

      // Parse FROM clause - handle table names with spaces using quotes or backticks
      const fromMatch = trimmedQuery.match(/from\s+(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))/i)
      if (!fromMatch) {
        throw new Error('FROM clause is required. Syntax: SELECT columns FROM table')
      }
      const tableName = (fromMatch[1] || fromMatch[2] || fromMatch[3] || fromMatch[4]).toLowerCase()

      // Get the table
      const table = this.tables.get(tableName)
      if (!table) {
        const availableTables = Array.from(this.tables.keys()).join(', ')
        throw new Error(`Table "${tableName}" not found. Available tables: ${availableTables || 'none'}`)
      }

      let resultRows = [...table.rows]
      let resultColumns: string[] = []

      // Parse WHERE clause (optional)
      const whereMatch = trimmedQuery.match(/where\s+(.*?)(?:$|order|group|limit)/s)
      if (whereMatch) {
        const whereClause = whereMatch[1].trim()
        resultRows = this.applyWhere(resultRows, whereClause)
      }

      // Parse JOIN clause (optional) - handle table names with spaces
      const joinMatch = trimmedQuery.match(/join\s+(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))\s+on\s+(.*?)(?:\s+where|\s*$)/i)
      if (joinMatch) {
        const joinTableName = (joinMatch[1] || joinMatch[2] || joinMatch[3] || joinMatch[4]).toLowerCase()
        const joinCondition = joinMatch[5].trim()
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
        const columnMappings: { [key: string]: string } = {}
        
        // Process each column (could be expression or alias)
        for (const col of columns) {
          // Handle FN.functionName() calls
          const fnMatch = col.match(/fn\.(\w+)\((.*?)\)(?:\s+as\s+)?(\w+)?/i)
          if (fnMatch) {
            const [, funcName, params, alias] = fnMatch
            const columnName = alias || `${funcName}()`
            resultColumns.push(columnName)
            
            const func = this.functions.get(funcName.toLowerCase())
            if (func) {
              // Execute function for each row
              resultRows = resultRows.map(row => {
                try {
                  const result = secureFunctionEngine.execute(
                    func,
                    [], // No parameters for now
                    Array.from(this.tables.values()),
                    [], // No views for now
                    Array.from(this.functions.values())
                  )
                  console.log('Function result:', result, 'for column:', columnName)
                  return {
                    ...row,
                    [columnName]: result
                  }
                } catch (error) {
                  console.error('Error executing function:', funcName, error)
                  return {
                    ...row,
                    [columnName]: null
                  }
                }
              })
            } else {
              console.warn('Function not found:', funcName)
            }
            continue
          }
          
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
              columnMappings[columnName] = fieldName
            }
          }
        }
        
        // Filter to only selected columns
        const hasFunctions = selectClause.toLowerCase().includes('fn.')
        const hasAggregates = selectClause.match(/\b(count|sum|avg|max|min)\s*\(/i)
        
        if (!hasAggregates && resultColumns.length > 0) {
          resultRows = resultRows.map(row => {
            const newRow: any = {}
            for (const col of resultColumns) {
              if (hasFunctions && col in row) {
                // Function result already in row
                newRow[col] = row[col]
              } else {
                // Regular column mapping
                const sourceField = columnMappings[col] || col
                newRow[col] = row[sourceField]
              }
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