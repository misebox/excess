import { Component, createMemo, Show } from 'solid-js'
import { Table, ChartSettings } from '@/models/types'

interface ChartElementProps {
  table: Table | null
  settings: ChartSettings
  onSettingsClick?: () => void
}

const ChartElement: Component<ChartElementProps> = (props) => {
  // Process data for chart
  const chartData = createMemo(() => {
    if (!props.table || !props.settings.xAxis || !props.settings.yAxis) {
      return null
    }

    const { xAxis, yAxis, groupBy, aggregation = 'sum' } = props.settings
    const rows = props.table.rows

    // Group data if needed
    const groups = new Map<string, any[]>()
    
    if (groupBy) {
      rows.forEach(row => {
        const key = String(row[groupBy] || 'null')
        if (!groups.has(key)) {
          groups.set(key, [])
        }
        groups.get(key)!.push(row)
      })
    } else {
      groups.set('all', rows)
    }

    // Process each group
    const processedData: any[] = []
    
    groups.forEach((groupRows, groupName) => {
      // Aggregate by x-axis values
      const xValues = new Map<string, number[]>()
      
      groupRows.forEach(row => {
        const xVal = String(row[xAxis] || 'null')
        const yVal = parseFloat(row[yAxis]) || 0
        
        if (!xValues.has(xVal)) {
          xValues.set(xVal, [])
        }
        xValues.get(xVal)!.push(yVal)
      })
      
      // Apply aggregation
      xValues.forEach((values, xVal) => {
        let result = 0
        switch (aggregation) {
          case 'sum':
            result = values.reduce((a, b) => a + b, 0)
            break
          case 'average':
            result = values.reduce((a, b) => a + b, 0) / values.length
            break
          case 'count':
            result = values.length
            break
          case 'min':
            result = Math.min(...values)
            break
          case 'max':
            result = Math.max(...values)
            break
        }
        
        processedData.push({
          x: xVal,
          y: result,
          group: groupBy ? groupName : undefined
        })
      })
    })
    
    return processedData
  })

  // Simple bar chart rendering (placeholder - you'd use a real chart library)
  const renderSimpleChart = () => {
    const data = chartData()
    if (!data || data.length === 0) return null

    const maxValue = Math.max(...data.map(d => d.y))
    const barWidth = 100 / data.length

    if (props.settings.chartType === 'bar') {
      return (
        <div class="h-full flex items-end justify-around px-2 pb-8">
          {data.map(item => (
            <div 
              class="flex flex-col items-center"
              style={{ width: `${barWidth}%` }}
            >
              <div 
                class="bg-blue-500 w-full mx-1 hover:bg-blue-600 transition-colors"
                style={{ height: `${(item.y / maxValue) * 100}%` }}
                title={`${item.x}: ${item.y}`}
              />
              <div class="text-xs mt-1 truncate w-full text-center">
                {item.x}
              </div>
            </div>
          ))}
        </div>
      )
    } else if (props.settings.chartType === 'pie') {
      const total = data.reduce((sum, item) => sum + item.y, 0)
      return (
        <div class="h-full flex flex-col items-center justify-center">
          <div class="text-sm font-medium mb-2">Pie Chart</div>
          {data.map((item, i) => (
            <div class="text-xs">
              {item.x}: {((item.y / total) * 100).toFixed(1)}%
            </div>
          ))}
        </div>
      )
    } else {
      return (
        <div class="h-full flex items-center justify-center text-gray-500">
          {props.settings.chartType} chart visualization
        </div>
      )
    }
  }

  return (
    <div class="h-full w-full flex flex-col bg-white">
      <div class="flex items-center justify-between px-2 py-1 bg-gray-50 border-b">
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-gray-600">
            {props.settings.title || `${props.settings.chartType} Chart`}
          </span>
          <Show when={props.settings.xAxis && props.settings.yAxis}>
            <span class="text-xs text-gray-500">
              ({props.settings.xAxis} × {props.settings.yAxis})
            </span>
          </Show>
        </div>
        <Show when={props.onSettingsClick}>
          <button
            onClick={props.onSettingsClick}
            class="p-1 hover:bg-gray-200 rounded"
            title="Settings"
          >
            ⚙️
          </button>
        </Show>
      </div>
      
      <div class="flex-1 p-2">
        <Show 
          when={chartData()} 
          fallback={
            <div class="h-full flex items-center justify-center text-gray-500">
              <div class="text-center">
                <div class="text-lg mb-2">📊</div>
                <div>Configure chart settings</div>
              </div>
            </div>
          }
        >
          {renderSimpleChart()}
        </Show>
      </div>
      
      <Show when={props.settings.showLegend && props.settings.groupBy}>
        <div class="px-2 py-1 bg-gray-50 border-t text-xs">
          <span class="font-medium">Groups: </span>
          <span class="text-gray-600">by {props.settings.groupBy}</span>
        </div>
      </Show>
    </div>
  )
}

export default ChartElement