import { Component, createSignal, Show, onMount, createEffect } from 'solid-js'
import { useParams, A, useNavigate } from '@solidjs/router'
import Sidebar from '../components/Sidebar'
import TableEditor from '../components/TableEditor'
import TableCreateDialog from '../components/TableCreateDialog'
import ViewEditor from '../components/ViewEditor'
import FunctionEditor from '../components/FunctionEditor'
import LayoutBuilder from '../components/LayoutBuilder'
import { Table, View, AppFunction, Layout } from '@/models/types'

interface ProjectData {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

const Project: Component = () => {
  const params = useParams()
  const navigate = useNavigate()
  
  // State for project info
  const [projectName, setProjectName] = createSignal<string>('')
  
  // State for the current project
  const [tables, setTables] = createSignal<Table[]>([])
  const [views, setViews] = createSignal<View[]>([])
  const [functions, setFunctions] = createSignal<AppFunction[]>([])
  const [layouts, setLayouts] = createSignal<Layout[]>([])
  
  // State for active item
  const [activeId, setActiveId] = createSignal<string | null>(null)
  const [activeType, setActiveType] = createSignal<'table' | 'view' | 'function' | 'layout' | null>(null)
  
  // State for create dialog
  const [showCreateTableDialog, setShowCreateTableDialog] = createSignal(false)
  
  // State for sidebar width
  const [sidebarWidth, setSidebarWidth] = createSignal(256) // 16rem = 256px
  const [isResizing, setIsResizing] = createSignal(false)
  
  // Load project data on mount
  onMount(() => {
    // Load project metadata
    const stored = localStorage.getItem('excess-projects')
    if (stored) {
      const projects: ProjectData[] = JSON.parse(stored)
      const currentProject = projects.find(p => p.id === params.projectId)
      if (currentProject) {
        setProjectName(currentProject.name)
      } else {
        // If project not found, use a default name or redirect
        setProjectName('Untitled Project')
      }
    }
    
    // Load project data (tables, views, functions, layouts)
    const projectDataKey = `excess-project-${params.projectId}`
    const projectData = localStorage.getItem(projectDataKey)
    if (projectData) {
      const data = JSON.parse(projectData)
      setTables(data.tables || [])
      setViews(data.views || [])
      setFunctions(data.functions || [])
      setLayouts(data.layouts || [])
      
      // Set active item from URL params
      if (params.tableId) {
        setActiveId(params.tableId)
        setActiveType('table')
      } else if (params.viewId) {
        setActiveId(params.viewId)
        setActiveType('view')
      } else if (params.functionId) {
        setActiveId(params.functionId)
        setActiveType('function')
      } else if (params.layoutId) {
        setActiveId(params.layoutId)
        setActiveType('layout')
      }
    }
  })
  
  // Auto-save project data whenever it changes
  createEffect(() => {
    const projectDataKey = `excess-project-${params.projectId}`
    const data = {
      tables: tables(),
      views: views(),
      functions: functions(),
      layouts: layouts()
    }
    localStorage.setItem(projectDataKey, JSON.stringify(data))
    console.log('Project data saved:', data)
  })
  
  const handleSelect = (id: string, type: 'table' | 'view' | 'function' | 'layout') => {
    console.log('handleSelect called:', { id, type, tables: tables() })
    
    // Navigate to dedicated table detail page for tables
    if (type === 'table') {
      navigate(`/projects/${params.projectId}/tables/${id}`)
    } else {
      setActiveId(id)
      setActiveType(type)
      // Update URL for other types
      navigate(`/projects/${params.projectId}/${type}s/${id}`, { replace: true })
    }
  }
  
  const handleRename = (id: string, type: 'table' | 'view' | 'function' | 'layout', newName: string) => {
    // Implementation for renaming items
    console.log('Rename:', id, type, newName)
  }
  
  const handleUpdateTable = (updatedTable: Table) => {
    setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t))
  }
  
  const handleUpdateView = (updatedView: View) => {
    setViews(prev => prev.map(v => v.id === updatedView.id ? updatedView : v))
  }
  
  const handleUpdateFunction = (updatedFunction: AppFunction) => {
    setFunctions(prev => prev.map(f => f.id === updatedFunction.id ? updatedFunction : f))
  }
  
  const handleUpdateLayout = (updatedLayout: Layout) => {
    console.log('handleUpdateLayout called with:', updatedLayout)
    setLayouts(prev => {
      const updated = prev.map(l => l.id === updatedLayout.id ? updatedLayout : l)
      console.log('Updated layouts:', updated)
      return updated
    })
  }
  
  const handleDelete = (id: string, type: 'table' | 'view' | 'function' | 'layout') => {
    switch (type) {
      case 'table':
        setTables(prev => prev.filter(t => t.id !== id))
        break
      case 'view':
        setViews(prev => prev.filter(v => v.id !== id))
        break
      case 'function':
        setFunctions(prev => prev.filter(f => f.id !== id))
        break
      case 'layout':
        setLayouts(prev => prev.filter(l => l.id !== id))
        break
    }
    
    // Clear active selection if deleted item was selected
    if (activeId() === id) {
      setActiveId(null)
      setActiveType(null)
    }
  }
  
  const getActiveTable = () => {
    const active = tables().find(t => t.id === activeId())
    console.log('getActiveTable:', { activeId: activeId(), active, tables: tables() })
    return active
  }
  const getActiveView = () => views().find(v => v.id === activeId())
  const getActiveFunction = () => functions().find(f => f.id === activeId())
  const getActiveLayout = () => layouts().find(l => l.id === activeId())
  
  // Import CSV to create new table
  const handleImportCSV = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      const text = await file.text()
      const lines = text.trim().split('\n')
      
      if (lines.length === 0) return
      
      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      
      // Create columns from headers
      const columns = headers.map((name, i) => ({
        id: `col_${Date.now()}_${i}`,
        name: name || `column_${i + 1}`,
        type: 'string' as const,  // Default to string type
        nullable: true
      }))
      
      // Parse rows
      const rows = lines.slice(1).map(line => {
        // Handle CSV with potential commas in quoted values
        const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || []
        const row: Record<string, any> = {}
        
        columns.forEach((col, i) => {
          let value = values[i]?.trim().replace(/^"|"$/g, '') || null
          
          // Try to infer type from first few rows
          if (value !== null && value !== '') {
            if (!isNaN(Number(value))) {
              row[col.name] = Number(value)
              // Update column type if all values so far are numbers
              if (columns[i].type === 'string') {
                columns[i].type = 'number' as const
              }
            } else if (value === 'true' || value === 'false') {
              row[col.name] = value === 'true'
              if (columns[i].type === 'string') {
                columns[i].type = 'boolean' as const
              }
            } else {
              row[col.name] = value
            }
          } else {
            row[col.name] = null
          }
        })
        return row
      })
      
      // Create table name from file name
      const fileName = file.name.replace(/\.csv$/i, '')
      const tableName = fileName.replace(/[^a-zA-Z0-9_]/g, '_')
      
      const newTable: Table = {
        id: `table_${Date.now()}`,
        title: tableName,
        comment: `Imported from ${file.name}`,
        columns,
        rows,
        primaryKey: [],
        foreignKeys: [],
        uniqueConstraints: [],
        indexes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setTables(prev => [...prev, newTable])
      handleSelect(newTable.id, 'table')
    }
    
    input.click()
  }
  
  // Handle creating a new table from dialog
  const handleCreateTable = (tableData: Omit<Table, 'id'>) => {
    const id = `table_${Date.now()}`
    const newTable: Table = {
      ...tableData,
      id,
      projectId: params.projectId
    }
    setTables(prev => [...prev, newTable])
    handleSelect(id, 'table')
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
  
  // Add a new item
  const handleAddNew = (type: 'table' | 'view' | 'function' | 'layout') => {
    const id = `${type}_${Date.now()}`
    const timestamp = new Date().toISOString()
    
    switch (type) {
      case 'table':
        // Show the create table dialog instead of creating directly
        setShowCreateTableDialog(true)
        break
        
      case 'view':
        const newView: View = {
          id,
          projectId: params.projectId,
          title: `New View`,
          query: '',
          sourceTables: []
        }
        setViews(prev => [...prev, newView])
        handleSelect(id, 'view')
        break
        
      case 'function':
        const newFunction: AppFunction = {
          id,
          name: `new_function`,
          body: '// Write your function here\nreturn null;',
          returnType: 'any',
          projectId: '',
          params: []
        }
        setFunctions(prev => [...prev, newFunction])
        handleSelect(id, 'function')
        break
        
      case 'layout':
        const newLayout: Layout = {
          id,
          projectId: params.projectId,
          title: `New Layout`,
          elements: []
        }
        setLayouts(prev => [...prev, newLayout])
        handleSelect(id, 'layout')
        break
    }
  }
  
  return (
    <div class="h-screen flex flex-col">
      <header class="bg-white shadow-sm border-b flex items-center justify-between px-4 py-2">
        <div class="flex items-center gap-4">
          <A href="/" class="text-blue-600 hover:text-blue-700">
            ← Projects
          </A>
          <h1 class="text-xl font-semibold">{projectName() || 'Loading...'}</h1>
        </div>
        
        <div class="flex gap-2">
          <button
            class="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            onClick={handleImportCSV}
            title="Import CSV file as new table"
          >
            📁 Import CSV
          </button>
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
            activeId={activeId()}
            activeType={activeType()}
            onSelect={handleSelect}
            onRename={handleRename}
            onUpdateTable={handleUpdateTable}
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
          <Show when={activeType() === 'table' && getActiveTable()}>
            {(table) => <TableEditor table={table()} onUpdate={handleUpdateTable} />}
          </Show>
          
          <Show when={activeType() === 'view' && getActiveView()}>
            {(view) => <ViewEditor view={view()} tables={tables()} onUpdate={handleUpdateView} />}
          </Show>
          
          <Show when={activeType() === 'function' && getActiveFunction()}>
            {(func) => <FunctionEditor function={func()} onUpdate={handleUpdateFunction} />}
          </Show>
          
          <Show when={activeType() === 'layout' && getActiveLayout()}>
            {(layout) => <LayoutBuilder layout={layout()} onUpdate={handleUpdateLayout} tables={tables()} />}
          </Show>
          
          <Show when={!activeId()}>
            <div class="flex items-center justify-center h-full text-gray-400">
              <div class="text-center">
                <p class="text-xl mb-4">Select an item from the sidebar or create a new one</p>
                <div class="flex gap-3 justify-center">
                  <button
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => handleAddNew('table')}
                  >
                    Create Table
                  </button>
                  <button
                    class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    onClick={() => handleAddNew('view')}
                  >
                    Create View
                  </button>
                </div>
              </div>
            </div>
          </Show>
        </main>
      </div>
      
      {/* Table Create Dialog */}
      <TableCreateDialog
        isOpen={showCreateTableDialog()}
        onClose={() => setShowCreateTableDialog(false)}
        onSave={handleCreateTable}
      />
    </div>
  )
}

export default Project