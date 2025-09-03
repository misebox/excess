import { Component, createSignal, Show, Switch, Match, onMount, createEffect } from 'solid-js'
import { Project, Table, View, Function, Layout } from './models/types'
import { db } from './services/database'
import ProjectSelector from './components/ProjectSelector'
import Sidebar from './components/Sidebar'
import TableEditor from './components/TableEditor'
import ViewEditor from './components/ViewEditor'
import FunctionEditor from './components/FunctionEditor'
import LayoutBuilder from './components/LayoutBuilder'

type ItemType = 'table' | 'view' | 'function' | 'layout'

const App: Component = () => {
  const [currentProject, setCurrentProject] = createSignal<Project | null>(null)
  const [tables, setTables] = createSignal<Table[]>([])
  const [views, setViews] = createSignal<View[]>([])
  const [functions, setFunctions] = createSignal<Function[]>([])
  const [layouts, setLayouts] = createSignal<Layout[]>([])
  
  const [activeId, setActiveId] = createSignal<string | null>(null)
  const [activeType, setActiveType] = createSignal<ItemType | null>(null)

  onMount(async () => {
    await db.init()
  })

  // Load project data when project changes
  createEffect(async () => {
    const project = currentProject()
    if (!project) return

    try {
      const [loadedTables, loadedViews, loadedFunctions, loadedLayouts] = await Promise.all([
        db.getTablesByProject(project.id),
        db.getViewsByProject(project.id),
        db.getFunctionsByProject(project.id),
        db.getLayoutsByProject(project.id)
      ])

      setTables(loadedTables)
      setViews(loadedViews)
      setFunctions(loadedFunctions)
      setLayouts(loadedLayouts)
    } catch (error) {
      console.error('Failed to load project data:', error)
    }
  })

  const handleSelectProject = async (project: Project) => {
    setCurrentProject(project)
    // Update project's last accessed time
    await db.updateProject({ ...project, updatedAt: new Date() })
  }

  const handleBackToProjects = () => {
    setCurrentProject(null)
    setActiveId(null)
    setActiveType(null)
  }

  const createNew = async (type: ItemType) => {
    const project = currentProject()
    if (!project) return

    const id = `${type}_${Date.now()}`

    switch (type) {
      case 'table': {
        const newTable: Table = {
          id,
          projectId: project.id,
          title: `Table ${tables().length + 1}`,
          columns: [
            { id: 'col1', name: 'Column 1', type: 'string' },
            { id: 'col2', name: 'Column 2', type: 'number' }
          ],
          rows: [
            { col1: 'Sample', col2: 123 }
          ]
        }
        await db.saveTable(newTable)
        setTables([...tables(), newTable])
        setActiveId(id)
        setActiveType('table')
        break
      }
      case 'view': {
        const newView: View = {
          id,
          projectId: project.id,
          title: `View ${views().length + 1}`,
          query: '',
          sourceTables: []
        }
        await db.saveView(newView)
        setViews([...views(), newView])
        setActiveId(id)
        setActiveType('view')
        break
      }
      case 'function': {
        const newFunction: Function = {
          id,
          projectId: project.id,
          name: `function${functions().length + 1}`,
          params: [],
          returnType: 'any',
          body: '',
          description: ''
        }
        await db.saveFunction(newFunction)
        setFunctions([...functions(), newFunction])
        setActiveId(id)
        setActiveType('function')
        break
      }
      case 'layout': {
        const newLayout: Layout = {
          id,
          projectId: project.id,
          title: `Layout ${layouts().length + 1}`,
          elements: []
        }
        await db.saveLayout(newLayout)
        setLayouts([...layouts(), newLayout])
        setActiveId(id)
        setActiveType('layout')
        break
      }
    }
  }

  const handleSelect = (id: string, type: ItemType) => {
    setActiveId(id)
    setActiveType(type)
  }

  const handleRename = async (id: string, type: ItemType, newName: string) => {
    switch (type) {
      case 'table': {
        const table = tables().find(t => t.id === id)
        if (table) {
          const updated = { ...table, title: newName }
          await db.saveTable(updated)
          setTables(tables().map(t => t.id === id ? updated : t))
        }
        break
      }
      case 'view': {
        const view = views().find(v => v.id === id)
        if (view) {
          const updated = { ...view, title: newName }
          await db.saveView(updated)
          setViews(views().map(v => v.id === id ? updated : v))
        }
        break
      }
      case 'function': {
        const func = functions().find(f => f.id === id)
        if (func) {
          const updated = { ...func, name: newName }
          await db.saveFunction(updated)
          setFunctions(functions().map(f => f.id === id ? updated : f))
        }
        break
      }
      case 'layout': {
        const layout = layouts().find(l => l.id === id)
        if (layout) {
          const updated = { ...layout, title: newName }
          await db.saveLayout(updated)
          setLayouts(layouts().map(l => l.id === id ? updated : l))
        }
        break
      }
    }
  }

  const updateTable = async (table: Table) => {
    await db.saveTable(table)
    setTables(tables().map(t => t.id === table.id ? table : t))
  }

  const updateView = async (view: View) => {
    await db.saveView(view)
    setViews(views().map(v => v.id === view.id ? view : v))
  }

  const updateFunction = async (func: Function) => {
    await db.saveFunction(func)
    setFunctions(functions().map(f => f.id === func.id ? func : f))
  }

  const updateLayout = async (layout: Layout) => {
    await db.saveLayout(layout)
    setLayouts(layouts().map(l => l.id === layout.id ? layout : l))
  }

  const getActiveItem = () => {
    if (!activeId() || !activeType()) return null
    
    switch (activeType()) {
      case 'table':
        return tables().find(t => t.id === activeId())
      case 'view':
        return views().find(v => v.id === activeId())
      case 'function':
        return functions().find(f => f.id === activeId())
      case 'layout':
        return layouts().find(l => l.id === activeId())
      default:
        return null
    }
  }

  return (
    <Show when={currentProject()} fallback={<ProjectSelector onSelectProject={handleSelectProject} />}>
      <div class="h-screen flex flex-col bg-gray-50">
        <header class="bg-white border-b px-4 py-2 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button
              class="text-gray-500 hover:text-gray-700"
              onClick={handleBackToProjects}
              title="Back to projects"
            >
              ←
            </button>
            <div>
              <h1 class="text-2xl font-bold text-gray-800">{currentProject()?.name}</h1>
              <p class="text-sm text-gray-600">Excess - Table Calculation App</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              class="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => createNew('table')}
            >
              + Table
            </button>
            <button
              class="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              onClick={() => createNew('view')}
            >
              + View
            </button>
            <button
              class="px-3 py-1.5 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
              onClick={() => createNew('function')}
            >
              + Function
            </button>
            <button
              class="px-3 py-1.5 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
              onClick={() => createNew('layout')}
            >
              + Layout
            </button>
          </div>
        </header>
        
        <div class="flex-1 flex overflow-hidden">
          <Sidebar
            tables={tables()}
            views={views()}
            functions={functions()}
            layouts={layouts()}
            activeId={activeId()}
            activeType={activeType()}
            onSelect={handleSelect}
            onRename={handleRename}
          />
          
          <main class="flex-1 overflow-auto bg-white">
            <Show when={getActiveItem()} fallback={
              <div class="flex items-center justify-center h-full text-gray-400">
                <div class="text-center">
                  <p class="text-2xl mb-4">Welcome to {currentProject()?.name}</p>
                  <p>Create a new table, view, function, or layout to get started</p>
                </div>
              </div>
            }>
              <Switch>
                <Match when={activeType() === 'table'}>
                  <TableEditor
                    table={getActiveItem() as Table}
                    onUpdate={updateTable}
                  />
                </Match>
                <Match when={activeType() === 'view'}>
                  <ViewEditor
                    view={getActiveItem() as View}
                    tables={tables()}
                    onUpdate={updateView}
                  />
                </Match>
                <Match when={activeType() === 'function'}>
                  <FunctionEditor
                    function={getActiveItem() as Function}
                    onUpdate={updateFunction}
                  />
                </Match>
                <Match when={activeType() === 'layout'}>
                  <LayoutBuilder
                    layout={getActiveItem() as Layout}
                    onUpdate={updateLayout}
                  />
                </Match>
              </Switch>
            </Show>
          </main>
        </div>
      </div>
    </Show>
  )
}

export default App