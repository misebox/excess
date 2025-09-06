export interface Project {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type CellType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'json' | 'null'

export interface Column {
  id: string
  name: string
  type: CellType
  defaultValue?: any
  nullable?: boolean
  comment?: string
}

export interface Index {
  name: string
  columns: string[]  // column names
  unique?: boolean
}

export interface Table {
  id: string
  projectId: string
  title: string
  columns: Column[]
  rows: Record<string, any>[]
  comment?: string
  primaryKey?: string[]  // column names for composite primary key
  uniqueConstraints?: Index[]
  indexes?: Index[]
}

export interface View {
  id: string
  projectId: string
  title: string
  query: string
  sourceTables: string[]
}

export type ParamType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'null' 
  | 'object' 
  | 'array'
  | 'table'
  | 'view'
  | 'rows'
  | 'columns'
  | 'any'

export interface FunctionParam {
  name: string
  type: ParamType
  description?: string
}

export interface AppFunction {
  id: string
  projectId: string
  name: string
  params: FunctionParam[]
  returnType: ParamType
  body: string
  description?: string
}

export interface Layout {
  id: string
  projectId: string
  title: string
  elements: LayoutElement[]
}

export interface LayoutElement {
  id: string
  type: 'table' | 'view' | 'function' | 'text' | 'chart' | 'tableView'
  gridPosition: { col: number; row: number }
  gridSize: { cols: number; rows: number }
  data: any
}

export interface FilterCondition {
  column: string
  operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater' | 'less' | 'greater_equal' | 'less_equal' | 'is_null' | 'is_not_null'
  value?: any
}

export interface SortCondition {
  column: string
  direction: 'asc' | 'desc'
}

export interface TableViewSettings {
  tableId: string
  selectedColumns?: string[]  // null means all columns
  filters?: FilterCondition[]
  sortBy?: SortCondition[]
  limit?: number
  pageSize?: number  // Number of rows per page for pagination
}

export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter'

export interface ChartSettings {
  sourceType: 'table' | 'view'
  sourceId: string
  chartType: ChartType
  xAxis?: string  // column name
  yAxis?: string  // column name
  groupBy?: string  // column name for grouping
  aggregation?: 'sum' | 'average' | 'count' | 'min' | 'max'
  title?: string
  showLegend?: boolean
  showGrid?: boolean
  colors?: string[]
}

export interface TextElementSettings {
  content: string
  fontSize?: number
  fontWeight?: string
  textAlign?: 'left' | 'center' | 'right'
  color?: string
}

export type TabType = 'table' | 'view' | 'function' | 'layout'
export type { AppFunction as Function } // Alias for backward compatibility

export interface Tab {
  id: string
  type: TabType
  title: string
  data: Table | View | Function | Layout
}