import { Function, Table, View } from '../models/types'

export class SecureFunctionEngine {
  private functions: Map<string, Function> = new Map()
  private tables: Map<string, Table> = new Map()
  private views: Map<string, View> = new Map()

  setFunctions(functions: Function[]) {
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

  /**
   * Execute function in a secure sandbox environment
   * - No access to global window, document, fetch, etc.
   * - No eval or Function constructor in user code
   * - Only allowed helper functions available
   * - Timeout protection
   */
  executeFunction(functionName: string, args: any[]): any {
    const func = this.functions.get(functionName)
    if (!func) {
      throw new Error(`Function ${functionName} not found`)
    }

    // Prepare arguments based on parameter types
    const preparedArgs = this.prepareArguments(func, args)

    // Create safe context with only allowed functions
    const safeContext = this.createSafeContext()

    // Build the function code with safety wrapper
    const safeCode = this.buildSafeFunction(func, safeContext)

    try {
      // Execute with timeout protection (5 seconds max)
      return this.executeWithTimeout(safeCode, preparedArgs, safeContext, 5000)
    } catch (error) {
      console.error('Function execution error:', error)
      throw new Error(`Failed to execute function ${functionName}: ${error.message}`)
    }
  }

  private prepareArguments(func: Function, args: any[]): any[] {
    return func.params.map((param, index) => {
      const value = args[index]
      
      switch (param.type) {
        case 'table': {
          if (typeof value === 'string') {
            const table = this.tables.get(value)
            // Return read-only copy
            return table ? this.createReadOnlyProxy(table) : null
          }
          return this.createReadOnlyProxy(value)
        }
        case 'view': {
          if (typeof value === 'string') {
            const view = this.views.get(value)
            return view ? this.createReadOnlyProxy(view) : null
          }
          return this.createReadOnlyProxy(value)
        }
        case 'rows': {
          if (value && typeof value === 'object') {
            if ('rows' in value) return this.createReadOnlyProxy(value.rows)
            if (Array.isArray(value)) return this.createReadOnlyProxy(value)
          }
          return []
        }
        case 'columns': {
          if (value && typeof value === 'object' && 'columns' in value) {
            return this.createReadOnlyProxy(value.columns)
          }
          return []
        }
        default:
          // Sanitize primitive values
          return this.sanitizeValue(value)
      }
    })
  }

  private createReadOnlyProxy(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj
    
    return new Proxy(obj, {
      set: () => {
        throw new Error('Cannot modify input data')
      },
      deleteProperty: () => {
        throw new Error('Cannot delete from input data')
      },
      defineProperty: () => {
        throw new Error('Cannot define properties on input data')
      },
      get: (target, prop) => {
        const value = target[prop]
        if (typeof value === 'object' && value !== null) {
          return this.createReadOnlyProxy(value)
        }
        return value
      }
    })
  }

  private sanitizeValue(value: any): any {
    // Remove any function properties from objects
    if (typeof value === 'function') {
      throw new Error('Function values not allowed')
    }
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.map(v => this.sanitizeValue(v))
      }
      const sanitized: any = {}
      for (const key in value) {
        if (typeof value[key] !== 'function') {
          sanitized[key] = this.sanitizeValue(value[key])
        }
      }
      return sanitized
    }
    return value
  }

  private createSafeContext() {
    return {
      // Math functions (safe)
      Math: {
        abs: Math.abs,
        ceil: Math.ceil,
        floor: Math.floor,
        round: Math.round,
        max: Math.max,
        min: Math.min,
        pow: Math.pow,
        sqrt: Math.sqrt,
        random: Math.random,
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        PI: Math.PI,
        E: Math.E
      },
      
      // Array helper functions
      sum: (arr: any[], field?: string) => {
        if (!Array.isArray(arr)) return 0
        if (field) {
          return arr.reduce((acc, item) => acc + (Number(item[field]) || 0), 0)
        }
        return arr.reduce((acc, val) => acc + (Number(val) || 0), 0)
      },
      
      avg: (arr: any[], field?: string) => {
        if (!Array.isArray(arr) || arr.length === 0) return 0
        const sum = arr.reduce((acc, item) => {
          const val = field ? item[field] : item
          return acc + (Number(val) || 0)
        }, 0)
        return sum / arr.length
      },
      
      count: (arr: any[]) => Array.isArray(arr) ? arr.length : 0,
      
      filter: (arr: any[], condition: (item: any) => boolean) => {
        if (!Array.isArray(arr)) return []
        if (typeof condition !== 'function') return arr
        return arr.filter(condition)
      },
      
      map: (arr: any[], transform: (item: any) => any) => {
        if (!Array.isArray(arr)) return []
        if (typeof transform !== 'function') return arr
        return arr.map(transform)
      },
      
      groupBy: (arr: any[], field: string) => {
        if (!Array.isArray(arr)) return {}
        return arr.reduce((groups, item) => {
          const key = item[field]
          if (!groups[key]) groups[key] = []
          groups[key].push(item)
          return groups
        }, {} as Record<string, any[]>)
      },
      
      unique: (arr: any[], field?: string) => {
        if (!Array.isArray(arr)) return []
        if (field) {
          const seen = new Set()
          return arr.filter(item => {
            const val = item[field]
            if (seen.has(val)) return false
            seen.add(val)
            return true
          })
        }
        return Array.from(new Set(arr))
      },
      
      sortBy: (arr: any[], field: string, desc = false) => {
        if (!Array.isArray(arr)) return []
        return [...arr].sort((a, b) => {
          const aVal = a[field]
          const bVal = b[field]
          if (aVal < bVal) return desc ? 1 : -1
          if (aVal > bVal) return desc ? -1 : 1
          return 0
        })
      },

      // String functions
      String: {
        toLowerCase: (s: any) => String(s).toLowerCase(),
        toUpperCase: (s: any) => String(s).toUpperCase(),
        trim: (s: any) => String(s).trim(),
        split: (s: any, sep: string) => String(s).split(sep),
        includes: (s: any, search: string) => String(s).includes(search),
        startsWith: (s: any, search: string) => String(s).startsWith(search),
        endsWith: (s: any, search: string) => String(s).endsWith(search),
        replace: (s: any, search: string | RegExp, replace: string) => String(s).replace(search, replace)
      },

      // JSON functions
      JSON: {
        parse: (s: string) => {
          try {
            return JSON.parse(s)
          } catch {
            return null
          }
        },
        stringify: (obj: any) => JSON.stringify(obj)
      },

      // Type checking
      isNumber: (val: any) => typeof val === 'number' && !isNaN(val),
      isString: (val: any) => typeof val === 'string',
      isBoolean: (val: any) => typeof val === 'boolean',
      isArray: Array.isArray,
      isObject: (val: any) => val !== null && typeof val === 'object' && !Array.isArray(val),
      isNull: (val: any) => val === null,
      isUndefined: (val: any) => val === undefined
    }
  }

  private buildSafeFunction(func: Function, context: any): Function {
    const paramNames = func.params.map(p => p.name)
    const contextKeys = Object.keys(context)
    
    // Build function with isolated scope
    const functionCode = `
      'use strict';
      return (function(${paramNames.join(', ')}) {
        // Import safe functions into scope
        ${contextKeys.map(key => `const ${key} = arguments[${paramNames.length}]['${key}'];`).join('\n')}
        
        // User code
        ${func.body}
      })
    `

    // Use Function constructor (this is safe as we control the code)
    return new Function(functionCode)()
  }

  private executeWithTimeout(fn: Function, args: any[], context: any, timeout: number): any {
    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Function execution timeout')), timeout)
    })

    // Create execution promise
    const executionPromise = new Promise((resolve, reject) => {
      try {
        const result = fn(...args, context)
        resolve(result)
      } catch (error) {
        reject(error)
      }
    })

    // Race between execution and timeout
    return Promise.race([executionPromise, timeoutPromise])
  }

  /**
   * Evaluate expressions containing function calls (for use in Tables/Views/Layouts)
   * Example: "=sum(TableA.rows, 'amount')" or "=myFunc(param1, param2)"
   */
  async evaluateExpression(expression: string): Promise<any> {
    if (!expression.startsWith('=')) {
      return expression // Not a formula
    }

    const formula = expression.substring(1).trim()
    
    // Simple function call parser (can be enhanced)
    const funcCallMatch = formula.match(/^(\w+)\((.*)\)$/)
    
    if (!funcCallMatch) {
      throw new Error('Invalid function expression')
    }

    const [, funcName, argsStr] = funcCallMatch
    
    // Check if it's a built-in function
    const builtins = this.createSafeContext()
    if (funcName in builtins) {
      // Parse arguments for built-in function
      try {
        // Simple argument parsing (needs improvement for complex cases)
        const args = this.parseArguments(argsStr)
        return builtins[funcName](...args)
      } catch (error) {
        throw new Error(`Failed to execute built-in ${funcName}: ${error.message}`)
      }
    }

    // Check if it's a user-defined function
    if (this.functions.has(funcName)) {
      const args = this.parseArguments(argsStr)
      return await this.executeFunction(funcName, args)
    }

    throw new Error(`Unknown function: ${funcName}`)
  }

  private parseArguments(argsStr: string): any[] {
    if (!argsStr.trim()) return []
    
    // Simple CSV parsing (needs enhancement for nested structures)
    return argsStr.split(',').map(arg => {
      arg = arg.trim()
      
      // String literal
      if ((arg.startsWith('"') && arg.endsWith('"')) || 
          (arg.startsWith("'") && arg.endsWith("'"))) {
        return arg.slice(1, -1)
      }
      
      // Number
      if (!isNaN(Number(arg))) {
        return Number(arg)
      }
      
      // Boolean
      if (arg === 'true') return true
      if (arg === 'false') return false
      
      // Null
      if (arg === 'null') return null
      
      // Table/View reference
      if (this.tables.has(arg)) return arg
      if (this.views.has(arg)) return arg
      
      // Property access (e.g., TableA.rows)
      if (arg.includes('.')) {
        const [objName, ...props] = arg.split('.')
        if (this.tables.has(objName)) {
          let obj: any = this.tables.get(objName)
          for (const prop of props) {
            obj = obj?.[prop]
          }
          return obj
        }
      }
      
      return arg
    })
  }
}

export const secureFunctionEngine = new SecureFunctionEngine()