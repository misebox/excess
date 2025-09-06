import { Component, createSignal, onMount, Show, createEffect } from 'solid-js'
import { useParams, useNavigate, A } from '@solidjs/router'
import TableEditor from '@/components/TableEditor'
import Sidebar from '@/components/Sidebar'
import TableCreateDialog from '@/components/TableCreateDialog'
import ViewCreationDialog from '@/components/ViewCreationDialog'
import { Table, View, AppFunction, Layout } from '@/models/types'

const TableDetail: Component = () => {
  const params = useParams()
  const navigate = useNavigate()
  
  const [table, setTable] = createSignal<Table | null>(null)
  const [tables, setTables] = createSignal<Table[]>([])
  const [views, setViews] = createSignal<View[]>([])
  const [functions, setFunctions] = createSignal<AppFunction[]>([])
  const [layouts, setLayouts] = createSignal<Layout[]>([])
  const [projectName, setProjectName] = createSignal<string>('')
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<string | null>(null)
  const [sidebarWidth, setSidebarWidth] = createSignal(256)
  const [isResizing, setIsResizing] = createSignal(false)
  const [showCreateTableDialog, setShowCreateTableDialog] = createSignal(false)
  const [showCreateViewDialog, setShowCreateViewDialog] = createSignal(false)

  // onMount(() => {
  //   loadTableData()
  // })
  createEffect(() => {
    console.log("id が変わった:", params.tableId);
    loadTableData()
  });

  const loadTableData = () => {
    try {
      // Load project data
      const projectsData = localStorage.getItem('excess-projects')
      if (!projectsData) {
        setError('No projects found')
        setLoading(false)
        return
      }

      const projects = JSON.parse(projectsData)
      const project = projects.find((p: any) => p.id === params.projectId)
      
      if (!project) {
        setError('Project not found')
        setLoading(false)
        return
      }

      setProjectName(project.name)

      // Load table data
      const storageKey = `excess-project-${params.projectId}`
      const storedData = localStorage.getItem(storageKey)
      
      if (!storedData) {
        setError('No table data found')
        setLoading(false)
        return
      }

      const projectData = JSON.parse(storedData)
      setTables(projectData.tables || [])
      setViews(projectData.views || [])
      setFunctions(projectData.functions || [])
      setLayouts(projectData.layouts || [])
      
      const foundTable = projectData.tables?.find((t: Table) => t.id === params.tableId)
      
      if (!foundTable) {
        setError('Table not found')
        setLoading(false)
        return
      }

      setTable(foundTable)
      setLoading(false)
    } catch (err) {
      console.error('Error loading table data:', err)
      setError('Failed to load table data')
      setLoading(false)
    }
  }

  const handleTableUpdate = (updatedTable: Table) => {
    try {
      // Update table in storage
      const storageKey = `excess-project-${params.projectId}`
      const storedData = localStorage.getItem(storageKey)
      
      if (!storedData) return

      const projectData = JSON.parse(storedData)
      const tableIndex = projectData.tables?.findIndex((t: Table) => t.id === params.tableId)
      
      if (tableIndex !== undefined && tableIndex >= 0) {
        projectData.tables[tableIndex] = updatedTable
        localStorage.setItem(storageKey, JSON.stringify(projectData))
        setTable(updatedTable)
        setTables(projectData.tables)
      }
    } catch (err) {
      console.error('Error updating table:', err)
    }
  }

  // Handle sidebar resize
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing()) return
      const newWidth = Math.max(200, Math.min(480, e.clientX))
      setSidebarWidth(newWidth)
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleSelect = (id: string, type: 'table' | 'view' | 'function' | 'layout') => {
    if (type === 'table') {
      navigate(`/projects/${params.projectId}/tables/${id}`)
    } else {
      navigate(`/projects/${params.projectId}/${type}s/${id}`)
    }
  }

  const handleRename = (id: string, type: 'table' | 'view' | 'function' | 'layout', newName: string) => {
    // Implementation for renaming items
    console.log('Rename:', id, type, newName)
  }

  const handleDelete = (id: string, type: 'table' | 'view' | 'function' | 'layout') => {
    // Implementation would go here
    console.log('Delete:', id, type)
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
    // Navigate to the new view
    navigate(`/projects/${params.projectId}/views/${id}`)
  }

  // Auto-save project data whenever it changes
  createEffect(() => {
    const projectDataKey = `excess-project-${params.projectId}`
    const data = {
      tables: tables(),
      views: views(),
      functions: functions(),
      layouts: layouts()
    }
    if (tables().length > 0 || views().length > 0 || functions().length > 0 || layouts().length > 0) {
      localStorage.setItem(projectDataKey, JSON.stringify(data))
    }
  })

  return (
    <div class="h-screen flex flex-col">
      <header class="bg-white shadow-sm border-b flex items-center justify-between px-4 py-2">
        <div class="flex items-center gap-4">
          <A href="/" class="text-blue-600 hover:text-blue-700">
            ← Projects
          </A>
          <h1 class="text-xl font-semibold">{projectName() || 'Loading...'}</h1>
        </div>
      </header>
      
      <div class="flex-1 flex overflow-hidden">
        <div 
          class="bg-gray-50 border-r h-full overflow-y-auto relative"
          style={{ width: `${sidebarWidth()}px` }}
        >
          <Sidebar
            tables={tables()}
            views={views()}
            functions={functions()}
            layouts={layouts()}
            activeId={params.tableId}
            activeType="table"
            onSelect={handleSelect}
            onRename={handleRename}
            onUpdateTable={handleTableUpdate}
            onAddNew={handleAddNew}
            onDelete={handleDelete}
          />
        </div>
        
        {/* Resize handle */}
        <div
          class={`w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors ${
            isResizing() ? 'bg-blue-500' : ''
          }`}
          onMouseDown={handleMouseDown}
          style={{ "user-select": "none" }}
        />
        
        <main class="flex-1 overflow-auto bg-white">
          <Show when={loading()}>
            <div class="flex items-center justify-center h-64">
              <div class="text-gray-500">Loading table...</div>
            </div>
          </Show>

          <Show when={error()}>
            <div class="flex items-center justify-center h-64">
              <div class="text-red-600">{error()}</div>
            </div>
          </Show>

          <Show when={!loading() && !error() && table()}>
            <TableEditor
              table={table()!}
              onUpdate={handleTableUpdate}
            />
          </Show>
        </main>
      </div>
      
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

export default TableDetail