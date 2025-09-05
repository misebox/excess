import { Component, For, createSignal, onMount } from 'solid-js'
import { A, useNavigate } from '@solidjs/router'

interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

const Home: Component = () => {
  const navigate = useNavigate()
  
  // Load projects from localStorage
  const loadProjects = (): Project[] => {
    const stored = localStorage.getItem('excess-projects')
    return stored ? JSON.parse(stored) : []
  }
  
  // Save projects to localStorage
  const saveProjects = (projectList: Project[]) => {
    localStorage.setItem('excess-projects', JSON.stringify(projectList))
  }
  
  const [projects, setProjects] = createSignal<Project[]>([])
  const [newProjectName, setNewProjectName] = createSignal('')
  const [newProjectDescription, setNewProjectDescription] = createSignal('')
  const [showNewProjectForm, setShowNewProjectForm] = createSignal(false)
  
  onMount(() => {
    setProjects(loadProjects())
  })
  
  const createProject = () => {
    const name = newProjectName().trim()
    if (!name) return
    
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name,
      description: newProjectDescription().trim() || undefined,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    }
    
    const updatedProjects = [...projects(), newProject]
    setProjects(updatedProjects)
    saveProjects(updatedProjects)
    
    // Reset form
    setNewProjectName('')
    setNewProjectDescription('')
    setShowNewProjectForm(false)
    
    // Navigate to new project
    navigate(`/projects/${newProject.id}`)
  }

  return (
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 class="text-2xl font-bold text-gray-900">Excess</h1>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-gray-800">Your Projects</h2>
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => setShowNewProjectForm(true)}
            >
              + New Project
            </button>
          </div>

          {showNewProjectForm() && (
            <div class="mb-6 p-4 bg-white rounded-lg shadow">
              <h3 class="text-lg font-medium mb-3">Create New Project</h3>
              <div class="space-y-3">
                <input
                  type="text"
                  class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Project name..."
                  value={newProjectName()}
                  onInput={(e) => setNewProjectName(e.currentTarget.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createProject()}
                />
                <input
                  type="text"
                  class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description (optional)..."
                  value={newProjectDescription()}
                  onInput={(e) => setNewProjectDescription(e.currentTarget.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createProject()}
                />
                <div class="flex gap-3">
                  <button
                    class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={createProject}
                    disabled={!newProjectName().trim()}
                  >
                    Create
                  </button>
                  <button
                    class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    onClick={() => {
                      setShowNewProjectForm(false)
                      setNewProjectName('')
                      setNewProjectDescription('')
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <For each={projects()}>
              {(project) => (
                <A
                  href={`/projects/${project.id}`}
                  class="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
                >
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                  {project.description && (
                    <p class="text-gray-600 text-sm mb-4">{project.description}</p>
                  )}
                  <div class="text-xs text-gray-500">
                    <div>Created: {project.createdAt}</div>
                    <div>Updated: {project.updatedAt}</div>
                  </div>
                </A>
              )}
            </For>

            {projects().length === 0 && !showNewProjectForm() && (
              <div class="col-span-full text-center py-12">
                <p class="text-gray-500 mb-4">No projects yet</p>
                <button
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={() => setShowNewProjectForm(true)}
                >
                  Create your first project
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home