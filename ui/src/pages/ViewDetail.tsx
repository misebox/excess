import { Component, createSignal, createEffect, For, Show, onMount } from 'solid-js'
import { useParams, A, useNavigate } from '@solidjs/router'
import { View, Table, AppFunction, Layout } from '../models/types'
import { queryEngine } from '../services/queryEngine'
import Sidebar from '../components/Sidebar'
import ViewEditDialog from '../components/ViewEditDialog'
import TableCreateDialog from '../components/TableCreateDialog'
import ViewCreationDialog from '../components/ViewCreationDialog'
import { ResizablePanel, PageHeader, Button } from '../components/common'

const ViewDetail: Component = () => {
  const params = useParams()
  const navigate = useNavigate()
  const [view, setView] = createSignal<View | null>(null)
  const [tables, setTables] = createSignal<Table[]>([])
  const [views, setViews] = createSignal<View[]>([])
  const [functions, setFunctions] = createSignal<AppFunction[]>([])
  const [layouts, setLayouts] = createSignal<Layout[]>([])
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<string>('')
  
  const [queryResult, setQueryResult] = createSignal<{
    columns: string[]
    rows: any[]
    error?: string
  }>({ columns: [], rows: [] })
  
  const [isExecuting, setIsExecuting] = createSignal(false)
  const [autoRefresh, setAutoRefresh] = createSignal(false)
  const [refreshInterval, setRefreshInterval] = createSignal(5000)
  const [showSidebar, setShowSidebar] = createSignal(true)
  const [editingView, setEditingView] = createSignal<View | null>(null)
  const [showCreateTableDialog, setShowCreateTableDialog] = createSignal(false)
  const [showCreateViewDialog, setShowCreateViewDialog] = createSignal(false)

  onMount(() => {
    loadData()
  })

  const loadData = () => {
    try {
      setLoading(true)
      
      // Load all project data from localStorage
      const projectDataKey = `excess-project-${params.projectId}`
      const storedData = localStorage.getItem(projectDataKey)
      
      if (storedData) {
        const data = JSON.parse(storedData)
        console.log('Loaded project data:', data)
        setTables(data.tables || [])
        setViews(data.views || [])
        setFunctions(data.functions || [])
        setLayouts(data.layouts || [])
        
        // Find current view
        const currentView = data.views?.find((v: View) => v.id === params.viewId)
        if (currentView) {
          setView(currentView)
        } else {
          setError('View not found')
        }
      } else {
        // Fallback to old storage format
        const storedViews = localStorage.getItem(`views_${params.projectId}`)
        const storedTables = localStorage.getItem(`tables_${params.projectId}`)
        const storedFunctions = localStorage.getItem(`functions_${params.projectId}`)
        const storedLayouts = localStorage.getItem(`layouts_${params.projectId}`)
        
        if (storedViews) {
          const viewsData: View[] = JSON.parse(storedViews)
          setViews(viewsData)
          const currentView = viewsData.find(v => v.id === params.viewId)
          if (currentView) {
            setView(currentView)
          } else {
            setError('View not found')
          }
        }
        
        if (storedTables) {
          setTables(JSON.parse(storedTables))
        }
        
        if (storedFunctions) {
          setFunctions(JSON.parse(storedFunctions))
        }
        
        if (storedLayouts) {
          setLayouts(JSON.parse(storedLayouts))
        }
      }
    } catch (err) {
      setError('Failed to load view data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Update query engine with available tables and functions
  createEffect(() => {
    queryEngine.setTables(tables())
    queryEngine.setFunctions(functions())
  })

  // Execute query when view is loaded or auto-refresh is enabled
  createEffect(() => {
    const currentView = view()
    if (currentView && currentView.query) {
      executeQuery()
    }
  })

  // Setup auto-refresh
  createEffect(() => {
    if (autoRefresh() && view()) {
      const interval = setInterval(() => {
        executeQuery()
      }, refreshInterval())
      
      return () => clearInterval(interval)
    }
  })

  const executeQuery = () => {
    const currentView = view()
    console.log('Executing query for view:', currentView)
    if (!currentView || !currentView.query.trim()) {
      setQueryResult({ columns: [], rows: [], error: 'No query defined' })
      return
    }

    setIsExecuting(true)
    
    try {
      const result = queryEngine.executeQuery(currentView.query)
      console.log('Query result:', result)
      setQueryResult(result)
    } catch (error) {
      setQueryResult({ 
        columns: [], 
        rows: [], 
        error: error instanceof Error ? error.message : 'Query execution failed' 
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const formatCellValue = (value: any): string => {
    if (value === null) return 'null'
    if (value === undefined) return ''
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  const exportToCSV = () => {
    const result = queryResult()
    if (!result.columns.length || !result.rows.length) return

    const headers = result.columns.join(',')
    const rows = result.rows.map(row => 
      result.columns.map(col => {
        const value = row[col]
        const formatted = formatCellValue(value)
        // Escape quotes and wrap in quotes if contains comma
        if (formatted.includes(',') || formatted.includes('"')) {
          return `"${formatted.replace(/"/g, '""')}"`
        }
        return formatted
      }).join(',')
    )

    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${view()?.title || 'view'}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getCellClass = (value: any): string => {
    if (value === null) return 'text-gray-400 italic'
    if (typeof value === 'boolean') return value ? 'text-green-600' : 'text-red-600'
    if (typeof value === 'number') return 'text-blue-600 font-mono'
    return ''
  }


  const handleSelect = (id: string, type: 'table' | 'view' | 'function' | 'layout') => {
    if (type === 'table') {
      navigate(`/projects/${params.projectId}/tables/${id}`)
    } else if (type === 'view') {
      navigate(`/projects/${params.projectId}/views/${id}`)
    } else if (type === 'function' || type === 'layout') {
      // Navigate back to project page for functions and layouts
      navigate(`/projects/${params.projectId}/${type}s/${id}`)
    }
  }

  const handleRename = (id: string, type: 'table' | 'view' | 'function' | 'layout', newName: string) => {
    // Update name in local state and save to localStorage
    if (type === 'view') {
      setViews(prev => prev.map(v => v.id === id ? { ...v, title: newName } : v))
      if (view()?.id === id) {
        setView(prev => prev ? { ...prev, title: newName } : prev)
      }
    }
    // Save to localStorage
    const projectDataKey = `excess-project-${params.projectId}`
    const data = {
      tables: tables(),
      views: views(),
      functions: functions(),
      layouts: layouts()
    }
    localStorage.setItem(projectDataKey, JSON.stringify(data))
  }

  const handleUpdateTable = () => {
    // Tables are read-only in view detail
  }

  const handleAddNew = (type: 'table' | 'view' | 'function' | 'layout') => {
    switch (type) {
      case 'table':
        setShowCreateTableDialog(true)
        break
      case 'view':
        setShowCreateViewDialog(true)
        break
      case 'function':
      case 'layout':
        // For function and layout, navigate to project page
        navigate(`/projects/${params.projectId}`)
        break
    }
  }
  
  const handleCreateTable = (tableData: Omit<Table, 'id'>) => {
    const id = `table_${Date.now()}`
    const newTable: Table = {
      ...tableData,
      id,
      projectId: params.projectId
    }
    setTables(prev => [...prev, newTable])
    // Save to localStorage
    const projectDataKey = `excess-project-${params.projectId}`
    const data = {
      tables: tables(),
      views: views(),
      functions: functions(),
      layouts: layouts()
    }
    localStorage.setItem(projectDataKey, JSON.stringify(data))
    // Navigate to the new table
    navigate(`/projects/${params.projectId}/tables/${id}`)
  }
  
  const handleCreateView = (viewData: Omit<View, 'id'>) => {
    const id = `view_${Date.now()}`
    const newView: View = {
      ...viewData,
      id,
      projectId: params.projectId
    }
    setViews(prev => [...prev, newView])
    // Save to localStorage
    const projectDataKey = `excess-project-${params.projectId}`
    const data = {
      tables: tables(),
      views: views(),
      functions: functions(),
      layouts: layouts()
    }
    localStorage.setItem(projectDataKey, JSON.stringify(data))
    // Navigate to the new view
    navigate(`/projects/${params.projectId}/views/${id}`)
  }

  const handleDelete = () => {
    // Navigate to project page to delete items
    navigate(`/projects/${params.projectId}`)
  }

  const handleEditView = (view: View) => {
    setEditingView(view)
  }

  const handleUpdateViewFromDialog = (updatedView: View) => {
    setViews(prev => prev.map(v => v.id === updatedView.id ? updatedView : v))
    if (view()?.id === updatedView.id) {
      setView(updatedView)
      // Re-execute query with updated settings
      executeQuery()
    }
    // Save to localStorage
    const projectDataKey = `excess-project-${params.projectId}`
    const data = {
      tables: tables(),
      views: views(),
      functions: functions(),
      layouts: layouts()
    }
    localStorage.setItem(projectDataKey, JSON.stringify(data))
  }

  return (
    <div class="h-screen flex flex-col">
      <PageHeader
        title={view()?.title || 'View'}
        backLink={{
          href: `/projects/${params.projectId}`,
          label: '← Back to Project'
        }}
        actions={
          <>
            <button
              class="p-2 hover:bg-gray-100 rounded"
              onClick={() => setShowSidebar(!showSidebar())}
              title={showSidebar() ? 'Hide sidebar' : 'Show sidebar'}
            >
              {showSidebar() ? '◀' : '▶'}
            </button>
            
            <Button
              variant="primary"
              onClick={executeQuery}
              disabled={isExecuting()}
            >
              {isExecuting() ? 'Refreshing...' : 'Refresh'}
            </Button>
          
          <div class="flex items-center gap-2">
            <label class="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh()}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
            <Show when={autoRefresh()}>
              <select
                class="px-2 py-1 border rounded text-sm"
                value={refreshInterval()}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
              >
                <option value={3000}>3s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
                <option value={60000}>1m</option>
              </select>
            </Show>
          </div>
            
            <Button
              variant="success"
              onClick={exportToCSV}
              disabled={!queryResult().rows.length}
            >
              Export CSV
            </Button>
          </>
        }
      />
      
      <div class="flex-1 flex overflow-hidden">
        <Show when={showSidebar()}>
          <ResizablePanel class="bg-gray-50 border-r">
            <Sidebar
              tables={tables()}
              views={views()}
              functions={functions()}
              layouts={layouts()}
              activeId={params.viewId}
              activeType="view"
              onSelect={handleSelect}
              onRename={handleRename}
              onUpdateTable={handleUpdateTable}
              onEditView={handleEditView}
              onAddNew={handleAddNew}
              onDelete={handleDelete}
            />
          </ResizablePanel>
        </Show>
        
        {/* Main content */}
        <main class="flex-1 overflow-hidden bg-gray-50">
        <Show when={loading()}>
          <div class="flex items-center justify-center h-full">
            <div class="text-gray-500">Loading view...</div>
          </div>
        </Show>
        
        <Show when={error()}>
          <div class="flex items-center justify-center h-full">
            <div class="text-red-600">Error: {error()}</div>
          </div>
        </Show>
        
        <Show when={!loading() && !error() && view()}>
          <div class="h-full flex flex-col">
            <div class="bg-white border-b px-4 py-2">
              <div class="text-sm text-gray-600 font-mono">{view()!.query}</div>
              <Show when={view()!.sourceTables.length > 0}>
                <div class="text-xs text-gray-500 mt-1">
                  Source tables: {view()!.sourceTables.join(', ')}
                </div>
              </Show>
            </div>
            
            <div class="flex-1 overflow-auto">
              <Show when={queryResult().error}>
                <div class="p-4 text-red-600 bg-red-50">
                  <span class="font-semibold">Error:</span> {queryResult().error}
                </div>
              </Show>
              
              <Show when={!queryResult().error && queryResult().columns.length > 0}>
                <div class="h-full overflow-auto">
                  <table class="min-w-full bg-white">
                    <thead class="bg-gray-100 sticky top-0 z-10">
                      <tr>
                        <th class="p-1 text-center text-xs text-gray-500 border-b border-r bg-gray-100 w-12">
                          #
                        </th>
                        <For each={queryResult().columns}>
                          {(column) => (
                            <th class="p-2 text-left text-sm font-medium text-gray-700 border-b border-r bg-gray-100">
                              {column}
                            </th>
                          )}
                        </For>
                      </tr>
                    </thead>
                    <tbody>
                      <Show when={queryResult().rows.length === 0}>
                        <tr>
                          <td 
                            colspan={queryResult().columns.length + 1} 
                            class="p-4 text-center text-gray-500"
                          >
                            No data available
                          </td>
                        </tr>
                      </Show>
                      <For each={queryResult().rows}>
                        {(row, index) => (
                          <tr class="border-b hover:bg-gray-50">
                            <td class="p-1 text-xs text-gray-400 text-center border-r bg-gray-50">
                              {index() + 1}
                            </td>
                            <For each={queryResult().columns}>
                              {(column) => (
                                <td class={`p-2 text-sm border-r ${getCellClass(row[column])}`}>
                                  {formatCellValue(row[column])}
                                </td>
                              )}
                            </For>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
              </Show>
              
              <Show when={!queryResult().error && queryResult().columns.length === 0}>
                <div class="p-8 text-center text-gray-500">
                  No query results to display
                </div>
              </Show>
            </div>
            
            <Show when={queryResult().rows.length > 0}>
              <div class="bg-white border-t px-4 py-2 text-sm text-gray-600 flex justify-between">
                <span>{queryResult().rows.length} row{queryResult().rows.length !== 1 ? 's' : ''}</span>
                <Show when={isExecuting()}>
                  <span class="text-blue-600">Refreshing...</span>
                </Show>
                <Show when={!isExecuting() && autoRefresh()}>
                  <span class="text-green-600">Auto-refresh enabled</span>
                </Show>
              </div>
            </Show>
          </div>
        </Show>
      </main>
      </div>
      
      {/* View Edit Dialog */}
      <ViewEditDialog
        view={editingView()}
        tables={tables()}
        isOpen={editingView() !== null}
        onClose={() => setEditingView(null)}
        onSave={(updatedView) => {
          handleUpdateViewFromDialog(updatedView)
          setEditingView(null)
        }}
      />
      
      {/* Table Create Dialog */}
      <TableCreateDialog
        isOpen={showCreateTableDialog()}
        onClose={() => setShowCreateTableDialog(false)}
        onSave={handleCreateTable}
      />
      
      {/* View Creation Dialog */}
      <ViewCreationDialog
        isOpen={showCreateViewDialog()}
        tables={tables()}
        onClose={() => setShowCreateViewDialog(false)}
        onSave={handleCreateView}
      />
    </div>
  )
}

export default ViewDetail