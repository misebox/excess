import { Component, createSignal, For, Show, createEffect } from 'solid-js'
import { Table, View, ChartSettings, ChartType } from '@/models/types'

interface ChartSettingsDialogProps {
  isOpen: boolean
  tables: Table[]
  views: View[]
  settings: ChartSettings | null
  onClose: () => void
  onSave: (settings: ChartSettings) => void
}

const ChartSettingsDialog: Component<ChartSettingsDialogProps> = (props) => {
  const [sourceType, setSourceType] = createSignal<'table' | 'view'>(props.settings?.sourceType || 'table')
  const [sourceId, setSourceId] = createSignal(props.settings?.sourceId || '')
  const [chartType, setChartType] = createSignal<ChartType>(props.settings?.chartType || 'bar')
  const [xAxis, setXAxis] = createSignal(props.settings?.xAxis || '')
  const [yAxis, setYAxis] = createSignal(props.settings?.yAxis || '')
  const [groupBy, setGroupBy] = createSignal(props.settings?.groupBy || '')
  const [aggregation, setAggregation] = createSignal(props.settings?.aggregation || 'sum')
  const [title, setTitle] = createSignal(props.settings?.title || '')
  const [showLegend, setShowLegend] = createSignal(props.settings?.showLegend !== false)
  const [showGrid, setShowGrid] = createSignal(props.settings?.showGrid !== false)

  // Update state when props change
  createEffect(() => {
    if (props.isOpen && props.settings) {
      setSourceType(props.settings.sourceType || 'table')
      setSourceId(props.settings.sourceId || '')
      setChartType(props.settings.chartType || 'bar')
      setXAxis(props.settings.xAxis || '')
      setYAxis(props.settings.yAxis || '')
      setGroupBy(props.settings.groupBy || '')
      setAggregation(props.settings.aggregation || 'sum')
      setTitle(props.settings.title || '')
      setShowLegend(props.settings.showLegend !== false)
      setShowGrid(props.settings.showGrid !== false)
    }
  })

  const chartTypes: { value: ChartType; label: string; icon: string }[] = [
    { value: 'bar', label: 'Bar Chart', icon: '📊' },
    { value: 'line', label: 'Line Chart', icon: '📈' },
    { value: 'pie', label: 'Pie Chart', icon: '🥧' },
    { value: 'area', label: 'Area Chart', icon: '📉' },
    { value: 'scatter', label: 'Scatter Plot', icon: '⚬' }
  ]

  const aggregations = [
    { value: 'sum', label: 'Sum' },
    { value: 'average', label: 'Average' },
    { value: 'count', label: 'Count' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' }
  ]

  const getSelectedSource = () => {
    if (sourceType() === 'table') {
      return props.tables.find(t => t.id === sourceId())
    } else {
      return props.views.find(v => v.id === sourceId())
    }
  }

  const getColumns = () => {
    const source = getSelectedSource()
    if (sourceType() === 'table' && source) {
      return (source as Table).columns.map(c => c.name)
    }
    // For views, we'd need to parse the query or have column metadata
    return []
  }

  const handleSave = () => {
    const settings: ChartSettings = {
      sourceType: sourceType(),
      sourceId: sourceId(),
      chartType: chartType(),
      xAxis: xAxis() || undefined,
      yAxis: yAxis() || undefined,
      groupBy: groupBy() || undefined,
      aggregation: aggregation() as any,
      title: title() || undefined,
      showLegend: showLegend(),
      showGrid: showGrid()
    }
    props.onSave(settings)
    props.onClose()
  }

  if (!props.isOpen) return null

  return (
    <div class="fixed inset-0 bg-black/30 flex items-center justify-center" style="z-index: 99999;">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b">
          <h2 class="text-xl font-bold">Chart Settings</h2>
        </div>
        
        <div class="flex-1 overflow-auto p-6 space-y-6">
          {/* Chart Type Selection */}
          <div>
            <h3 class="text-lg font-semibold mb-3">Chart Type</h3>
            <div class="grid grid-cols-3 gap-2">
              <For each={chartTypes}>
                {(type) => (
                  <button
                    class={`p-3 border rounded-lg hover:bg-gray-50 transition-colors ${
                      chartType() === type.value ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                    onClick={() => setChartType(type.value)}
                  >
                    <div class="text-2xl mb-1">{type.icon}</div>
                    <div class="text-sm">{type.label}</div>
                  </button>
                )}
              </For>
            </div>
          </div>

          {/* Data Source */}
          <div>
            <h3 class="text-lg font-semibold mb-3">Data Source</h3>
            <div class="flex gap-4 mb-3">
              <label class="flex items-center gap-2">
                <input
                  type="radio"
                  checked={sourceType() === 'table'}
                  onChange={() => setSourceType('table')}
                />
                <span>Table</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  type="radio"
                  checked={sourceType() === 'view'}
                  onChange={() => setSourceType('view')}
                />
                <span>View</span>
              </label>
            </div>
            
            <select
              class="w-full px-3 py-2 border rounded"
              value={sourceId()}
              onChange={(e) => setSourceId(e.currentTarget.value)}
            >
              <option value="">Select a {sourceType()}...</option>
              <Show when={sourceType() === 'table'}>
                <For each={props.tables}>
                  {(table) => (
                    <option value={table.id}>{table.title}</option>
                  )}
                </For>
              </Show>
              <Show when={sourceType() === 'view'}>
                <For each={props.views}>
                  {(view) => (
                    <option value={view.id}>{view.title}</option>
                  )}
                </For>
              </Show>
            </select>
          </div>

          {/* Axis Configuration */}
          <Show when={getColumns().length > 0}>
            <div>
              <h3 class="text-lg font-semibold mb-3">Axis Configuration</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1">X-Axis (Categories)</label>
                  <select
                    class="w-full px-3 py-2 border rounded"
                    value={xAxis()}
                    onChange={(e) => setXAxis(e.currentTarget.value)}
                  >
                    <option value="">Select column...</option>
                    <For each={getColumns()}>
                      {(col) => (
                        <option value={col}>{col}</option>
                      )}
                    </For>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-medium mb-1">Y-Axis (Values)</label>
                  <select
                    class="w-full px-3 py-2 border rounded"
                    value={yAxis()}
                    onChange={(e) => setYAxis(e.currentTarget.value)}
                  >
                    <option value="">Select column...</option>
                    <For each={getColumns()}>
                      {(col) => (
                        <option value={col}>{col}</option>
                      )}
                    </For>
                  </select>
                </div>
              </div>
              
              <Show when={chartType() !== 'pie'}>
                <div class="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label class="block text-sm font-medium mb-1">Group By</label>
                    <select
                      class="w-full px-3 py-2 border rounded"
                      value={groupBy()}
                      onChange={(e) => setGroupBy(e.currentTarget.value)}
                    >
                      <option value="">No grouping</option>
                      <For each={getColumns()}>
                        {(col) => (
                          <option value={col}>{col}</option>
                        )}
                      </For>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium mb-1">Aggregation</label>
                    <select
                      class="w-full px-3 py-2 border rounded"
                      value={aggregation()}
                      onChange={(e) => setAggregation(e.currentTarget.value)}
                    >
                      <For each={aggregations}>
                        {(agg) => (
                          <option value={agg.value}>{agg.label}</option>
                        )}
                      </For>
                    </select>
                  </div>
                </div>
              </Show>
            </div>
          </Show>

          {/* Chart Options */}
          <div>
            <h3 class="text-lg font-semibold mb-3">Chart Options</h3>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  class="w-full px-3 py-2 border rounded"
                  value={title()}
                  onInput={(e) => setTitle(e.currentTarget.value)}
                  placeholder="Chart title..."
                />
              </div>
              
              <div class="flex gap-4">
                <label class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showLegend()}
                    onChange={(e) => setShowLegend(e.currentTarget.checked)}
                  />
                  <span>Show Legend</span>
                </label>
                
                <label class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showGrid()}
                    onChange={(e) => setShowGrid(e.currentTarget.checked)}
                  />
                  <span>Show Grid</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div class="px-6 py-4 border-t flex justify-end gap-3">
          <button
            class="px-4 py-2 text-gray-600 hover:text-gray-800"
            onClick={props.onClose}
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleSave}
            disabled={!sourceId() || !xAxis() || !yAxis()}
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChartSettingsDialog