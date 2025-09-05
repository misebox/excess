import { Component, For, createSignal, Show } from 'solid-js'
import { AppFunction, FunctionParam, ParamType, Table } from '../models/types'
import { secureFunctionEngine } from '../services/secureFunctionEngine'

interface FunctionEditorProps {
  function: AppFunction
  onUpdate: (func: AppFunction) => void
}

const FunctionEditor: Component<FunctionEditorProps> = (props) => {
  const [editingParam, setEditingParam] = createSignal<number | null>(null)
  const [newParamName, setNewParamName] = createSignal('')
  const [newParamType, setNewParamType] = createSignal<ParamType>('any')
  const [showAddParam, setShowAddParam] = createSignal(false)
  const [testResult, setTestResult] = createSignal<any>(null)
  const [testError, setTestError] = createSignal<string>('')
  const [consoleOutput, setConsoleOutput] = createSignal<string[]>([])
  const [showTest, setShowTest] = createSignal(false)

  const paramTypes: ParamType[] = [
    'string', 'number', 'boolean', 'null', 'object', 'array',
    'table', 'view', 'rows', 'columns', 'any'
  ]

  const getTypeColor = (type: ParamType) => {
    const colors: Record<ParamType, string> = {
      string: 'bg-green-100 text-green-700',
      number: 'bg-blue-100 text-blue-700',
      boolean: 'bg-purple-100 text-purple-700',
      null: 'bg-gray-100 text-gray-700',
      object: 'bg-yellow-100 text-yellow-700',
      array: 'bg-orange-100 text-orange-700',
      table: 'bg-indigo-100 text-indigo-700',
      view: 'bg-teal-100 text-teal-700',
      rows: 'bg-pink-100 text-pink-700',
      columns: 'bg-red-100 text-red-700',
      any: 'bg-gray-100 text-gray-600'
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  const testFunction = () => {
    try {
      secureFunctionEngine.clearConsoleOutput()
      
      // Create test arguments based on parameter types
      const testArgs = props.function.params.map(param => {
        switch(param.type) {
          case 'string': return 'test'
          case 'number': return 42
          case 'boolean': return true
          case 'array': return [1, 2, 3]
          case 'object': return { key: 'value' }
          case 'table': return { title: 'TestTable', columns: [], rows: [] }
          case 'rows': return [{ id: 1, name: 'test' }]
          default: return null
        }
      })
      
      const result = secureFunctionEngine.execute(
        props.function,
        testArgs,
        [], // tables
        [], // views
        [] // functions
      )
      
      setTestResult(result)
      setTestError('')
      setConsoleOutput(secureFunctionEngine.getConsoleOutput())
    } catch (error) {
      setTestError(error.message)
      setTestResult(null)
      setConsoleOutput(secureFunctionEngine.getConsoleOutput())
    }
  }

  const addParameter = () => {
    if (!newParamName().trim()) return
    
    const newParam: FunctionParam = {
      name: newParamName().trim(),
      type: newParamType()
    }
    
    props.onUpdate({
      ...props.function,
      params: [...props.function.params, newParam]
    })
    
    setNewParamName('')
    setNewParamType('any')
    setShowAddParam(false)
  }

  const removeParameter = (index: number) => {
    const newParams = [...props.function.params]
    newParams.splice(index, 1)
    props.onUpdate({ ...props.function, params: newParams })
  }

  const updateParameter = (index: number, param: FunctionParam) => {
    const newParams = [...props.function.params]
    newParams[index] = param
    props.onUpdate({ ...props.function, params: newParams })
  }

  const getFunctionSignature = () => {
    const params = props.function.params
      .map(p => `${p.name}: ${p.type}`)
      .join(', ')
    return `${props.function.name}(${params}): ${props.function.returnType}`
  }

  return (
    <div class="p-4 max-w-4xl mx-auto">
      <div class="mb-6">
        <h2 class="text-xl font-bold mb-2">{props.function.name}</h2>
        <div class="font-mono text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
          {getFunctionSignature()}
        </div>
      </div>
      
      <div class="mb-6">
        <label class="block text-sm font-medium mb-2">Function Name</label>
        <input
          class="w-full px-3 py-2 border rounded"
          value={props.function.name}
          onInput={(e) => props.onUpdate({ ...props.function, name: e.target.value })}
        />
      </div>

      <div class="mb-6">
        <label class="block text-sm font-medium mb-2">Description</label>
        <textarea
          class="w-full px-3 py-2 border rounded"
          rows="2"
          value={props.function.description || ''}
          placeholder="Describe what this function does..."
          onInput={(e) => props.onUpdate({ ...props.function, description: e.target.value })}
        />
      </div>
      
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium">Parameters</label>
          <button
            class="text-sm text-blue-600 hover:text-blue-700"
            onClick={() => setShowAddParam(!showAddParam())}
          >
            + Add Parameter
          </button>
        </div>
        
        <div class="space-y-2">
          <For each={props.function.params}>
            {(param, index) => (
              <div class="flex items-center gap-2 p-2 border rounded bg-white">
                <Show when={editingParam() === index()} fallback={
                  <>
                    <span class="font-mono text-sm flex-1">{param.name}</span>
                    <span class={`px-2 py-1 text-xs rounded ${getTypeColor(param.type)}`}>
                      {param.type}
                    </span>
                    <button
                      class="text-gray-500 hover:text-gray-700 px-2"
                      onClick={() => setEditingParam(index())}
                    >
                      ✎
                    </button>
                    <button
                      class="text-red-500 hover:text-red-700 px-2"
                      onClick={() => removeParameter(index())}
                    >
                      ×
                    </button>
                  </>
                }>
                  <input
                    class="flex-1 px-2 py-1 border rounded text-sm"
                    value={param.name}
                    onInput={(e) => updateParameter(index(), { ...param, name: e.target.value })}
                  />
                  <select
                    class="px-2 py-1 border rounded text-sm"
                    value={param.type}
                    onChange={(e) => updateParameter(index(), { ...param, type: e.currentTarget.value as ParamType })}
                  >
                    <For each={paramTypes}>
                      {(type) => <option value={type}>{type}</option>}
                    </For>
                  </select>
                  <button
                    class="text-green-600 hover:text-green-700 px-2"
                    onClick={() => setEditingParam(null)}
                  >
                    ✓
                  </button>
                </Show>
              </div>
            )}
          </For>
          
          <Show when={showAddParam()}>
            <div class="flex items-center gap-2 p-2 border-2 border-dashed border-blue-300 rounded bg-blue-50">
              <input
                class="flex-1 px-2 py-1 border rounded bg-white text-sm"
                placeholder="Parameter name..."
                value={newParamName()}
                onInput={(e) => setNewParamName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addParameter()
                  if (e.key === 'Escape') {
                    setShowAddParam(false)
                    setNewParamName('')
                  }
                }}
                autofocus
              />
              <select
                class="px-2 py-1 border rounded bg-white text-sm"
                value={newParamType()}
                onChange={(e) => setNewParamType(e.currentTarget.value as ParamType)}
              >
                <For each={paramTypes}>
                  {(type) => <option value={type}>{type}</option>}
                </For>
              </select>
              <button
                class="text-green-600 hover:text-green-700 px-2"
                onClick={addParameter}
              >
                ✓
              </button>
              <button
                class="text-gray-500 hover:text-gray-700 px-2"
                onClick={() => {
                  setShowAddParam(false)
                  setNewParamName('')
                }}
              >
                ×
              </button>
            </div>
          </Show>
        </div>
      </div>

      <div class="mb-6">
        <label class="block text-sm font-medium mb-2">Return Type</label>
        <select
          class="w-full px-3 py-2 border rounded"
          value={props.function.returnType}
          onChange={(e) => props.onUpdate({ ...props.function, returnType: e.currentTarget.value as ParamType })}
        >
          <For each={paramTypes}>
            {(type) => <option value={type}>{type}</option>}
          </For>
        </select>
      </div>
      
      <div class="mb-6">
        <label class="block text-sm font-medium mb-2">Function Body (JavaScript)</label>
        <textarea
          class="w-full h-64 px-3 py-2 border rounded font-mono text-sm bg-gray-50"
          value={props.function.body}
          placeholder="// Available variables: All parameters by name&#10;// For table/view params: .rows, .columns properties&#10;// Return the computed value&#10;&#10;return param1 + param2"
          onInput={(e) => props.onUpdate({ ...props.function, body: e.target.value })}
        />
      </div>

      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium">Test Function</label>
          <button
            class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              setShowTest(!showTest())
              if (!showTest()) testFunction()
            }}
          >
            {showTest() ? 'Hide Test' : 'Run Test'}
          </button>
        </div>
        
        {showTest() && (
          <div class="border rounded p-4 space-y-3">
            {testError() ? (
              <div class="bg-red-50 border border-red-200 rounded p-3">
                <div class="text-sm font-medium text-red-900">Error:</div>
                <div class="text-sm text-red-700 font-mono">{testError()}</div>
              </div>
            ) : testResult() !== null && (
              <div class="bg-green-50 border border-green-200 rounded p-3">
                <div class="text-sm font-medium text-green-900">Result:</div>
                <div class="text-sm text-green-700 font-mono">
                  {typeof testResult() === 'object' 
                    ? JSON.stringify(testResult(), null, 2)
                    : String(testResult())
                  }
                </div>
              </div>
            )}
            
            {consoleOutput().length > 0 && (
              <div class="bg-gray-50 border border-gray-200 rounded p-3">
                <div class="text-sm font-medium text-gray-900 mb-2">Console Output:</div>
                <div class="space-y-1">
                  {consoleOutput().map(line => (
                    <div class="text-sm text-gray-700 font-mono">{line}</div>
                  ))}
                </div>
              </div>
            )}
            
            <div class="text-xs text-gray-500">
              Test arguments: {props.function.params.map(p => p.name).join(', ') || 'none'}
            </div>
          </div>
        )}
      </div>

      <div class="bg-blue-50 border border-blue-200 rounded p-4">
        <h3 class="font-medium text-blue-900 mb-2">Usage Examples</h3>
        <div class="text-sm text-blue-800 space-y-1 font-mono">
          <div>// In Views: SELECT {props.function.name}(column1, column2) FROM table</div>
          <div>// In Layouts: ={props.function.name}(TableA, ViewB.rows)</div>
          <div>// With tables: {props.function.name}(myTable).rows[0].columnName</div>
          <div>// Debug: console.log('value:', myVariable)</div>
        </div>
      </div>
    </div>
  )
}

export default FunctionEditor