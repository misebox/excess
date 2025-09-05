import { AppFunction, Table, View } from '../models/types'

export class FunctionEngine {
  private functions: Map<string, AppFunction> = new Map()
  private tables: Map<string, Table> = new Map()
  private views: Map<string, View> = new Map()

  setFunctions(functions: AppFunction[]) {
    this.functions.clear()
    functions.forEach(f => this.functions.set(f.name, f))
  }

  setTables(tables: Table[]) {
    this.tables.clear()
    tables.forEach(t => this.tables.set(t.title, t))
  }

  setViews(views: View[]) {
    this.views.clear()
    views.forEach(v => this.views.set(v.title, v))
  }

  executeFunction(functionName: string, args: any[]): any {
    const func = this.functions.get(functionName)
    if (!func) {
      throw new Error(`Function ${functionName} not found`)
    }

    // Prepare arguments based on parameter types
    const preparedArgs = func.params.map((param, index) => {
      const value = args[index]
      
      switch (param.type) {
        case 'table': {
          // If string, look up table by name
          if (typeof value === 'string') {
            return this.tables.get(value) || null
          }
          return value
        }
        case 'view': {
          // If string, look up view by name
          if (typeof value === 'string') {
            return this.views.get(value) || null
          }
          return value
        }
        case 'rows': {
          // Extract rows from table or view if needed
          if (value && typeof value === 'object') {
            if ('rows' in value) return value.rows
            if (Array.isArray(value)) return value
          }
          return []
        }
        case 'columns': {
          // Extract columns from table or view if needed
          if (value && typeof value === 'object' && 'columns' in value) {
            return value.columns
          }
          return []
        }
        default:
          return value
      }
    })

    // Create function context
    const paramNames = func.params.map(p => p.name)
    const funcBody = func.body

    try {
      // Create a safe function with parameters
      const executorFunc = new Function(
        ...paramNames,
        'tables',
        'views',
        'functions',
        `
        // Helper functions
        const sum = (arr, field) => {
          if (!Array.isArray(arr)) return 0;
          if (field) {
            return arr.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
          }
          return arr.reduce((acc, val) => acc + (Number(val) || 0), 0);
        };
        
        const avg = (arr, field) => {
          if (!Array.isArray(arr) || arr.length === 0) return 0;
          return sum(arr, field) / arr.length;
        };
        
        const count = (arr) => Array.isArray(arr) ? arr.length : 0;
        
        const max = (arr, field) => {
          if (!Array.isArray(arr) || arr.length === 0) return null;
          if (field) {
            return Math.max(...arr.map(item => Number(item[field]) || -Infinity));
          }
          return Math.max(...arr.map(val => Number(val) || -Infinity));
        };
        
        const min = (arr, field) => {
          if (!Array.isArray(arr) || arr.length === 0) return null;
          if (field) {
            return Math.min(...arr.map(item => Number(item[field]) || Infinity));
          }
          return Math.min(...arr.map(val => Number(val) || Infinity));
        };
        
        const filter = (arr, condition) => {
          if (!Array.isArray(arr)) return [];
          if (typeof condition === 'function') {
            return arr.filter(condition);
          }
          return arr;
        };
        
        const map = (arr, transform) => {
          if (!Array.isArray(arr)) return [];
          if (typeof transform === 'function') {
            return arr.map(transform);
          }
          return arr;
        };
        
        const groupBy = (arr, field) => {
          if (!Array.isArray(arr)) return {};
          return arr.reduce((groups, item) => {
            const key = item[field];
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
            return groups;
          }, {});
        };
        
        const join = (table1, table2, field1, field2) => {
          if (!table1?.rows || !table2?.rows) return [];
          const t1Rows = table1.rows || table1;
          const t2Rows = table2.rows || table2;
          const result = [];
          
          for (const row1 of t1Rows) {
            for (const row2 of t2Rows) {
              if (row1[field1] === row2[field2 || field1]) {
                result.push({ ...row1, ...row2 });
              }
            }
          }
          return result;
        };

        ${funcBody}
        `
      )

      // Execute the function with prepared arguments and context
      return executorFunc(
        ...preparedArgs,
        Object.fromEntries(this.tables),
        Object.fromEntries(this.views),
        Object.fromEntries(this.functions)
      )
    } catch (error) {
      console.error('Function execution error:', error)
      throw new Error(`Failed to execute function ${functionName}: ${error.message}`)
    }
  }

  // Parse and execute function calls in expressions (for Views and Layouts)
  evaluateExpression(expression: string): any {
    // Simple regex to find function calls like: functionName(arg1, arg2)
    const funcCallRegex = /(\w+)\s*\((.*?)\)/g
    
    let result = expression
    let match
    
    while ((match = funcCallRegex.exec(expression)) !== null) {
      const [fullMatch, funcName, argsStr] = match
      
      if (this.functions.has(funcName)) {
        try {
          // Parse arguments (simple parsing, can be enhanced)
          const args = argsStr
            .split(',')
            .map(arg => arg.trim())
            .map(arg => {
              // Try to parse as JSON first (for objects/arrays)
              try {
                return JSON.parse(arg)
              } catch {
                // If it's a string reference to table/view, keep as string
                // If it's a number, parse it
                if (!isNaN(Number(arg))) {
                  return Number(arg)
                }
                // Remove quotes if present
                if ((arg.startsWith('"') && arg.endsWith('"')) || 
                    (arg.startsWith("'") && arg.endsWith("'"))) {
                  return arg.slice(1, -1)
                }
                return arg
              }
            })
          
          const funcResult = this.executeFunction(funcName, args)
          result = result.replace(fullMatch, JSON.stringify(funcResult))
        } catch (error) {
          console.error(`Error evaluating function ${funcName}:`, error)
          result = result.replace(fullMatch, `ERROR: ${error.message}`)
        }
      }
    }
    
    return result
  }
}

export const functionEngine = new FunctionEngine()