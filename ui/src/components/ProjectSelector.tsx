import { Component, For, createSignal, onMount } from 'solid-js'
import { Project } from '../models/types'
import { db } from '../services/database'

interface ProjectSelectorProps {
  onSelectProject: (project: Project) => void
}

const ProjectSelector: Component<ProjectSelectorProps> = (props) => {
  const [projects, setProjects] = createSignal<Project[]>([])
  const [newProjectName, setNewProjectName] = createSignal('')
  const [isCreating, setIsCreating] = createSignal(false)

  const loadProjects = async () => {
    try {
      const allProjects = await db.getAllProjects()
      setProjects(allProjects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()))
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }

  onMount(async () => {
    await db.init()
    await loadProjects()
  })

  const createNewProject = async () => {
    const name = newProjectName().trim()
    if (!name) return

    try {
      const project: Project = {
        id: `project_${Date.now()}`,
        name,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await db.createProject(project)
      props.onSelectProject(project)
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const deleteProject = async (e: MouseEvent, projectId: string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this project? All data will be lost.')) return

    try {
      await db.deleteProject(projectId)
      await loadProjects()
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Excess</h1>
        <p class="text-gray-600 mb-8">Select a project to continue or create a new one</p>

        {/* New Project Section */}
        <div class="mb-8">
          {!isCreating() ? (
            <button
              class="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              onClick={() => setIsCreating(true)}
            >
              <div class="flex items-center justify-center gap-2">
                <span class="text-2xl">+</span>
                <span class="text-lg font-medium">Create New Project</span>
              </div>
            </button>
          ) : (
            <div class="p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
              <input
                class="w-full px-3 py-2 border rounded mb-3"
                placeholder="Enter project name..."
                value={newProjectName()}
                onInput={(e) => setNewProjectName(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createNewProject()
                  if (e.key === 'Escape') {
                    setIsCreating(false)
                    setNewProjectName('')
                  }
                }}
                autofocus
              />
              <div class="flex gap-2">
                <button
                  class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={createNewProject}
                  disabled={!newProjectName().trim()}
                >
                  Create
                </button>
                <button
                  class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  onClick={() => {
                    setIsCreating(false)
                    setNewProjectName('')
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Existing Projects */}
        <div>
          <h2 class="text-sm font-semibold text-gray-500 uppercase mb-3">Recent Projects</h2>
          {projects().length === 0 ? (
            <div class="text-center py-8 text-gray-400">
              No projects yet. Create your first project to get started!
            </div>
          ) : (
            <div class="space-y-2">
              <For each={projects()}>
                {(project) => (
                  <div
                    class="group p-4 border rounded-lg hover:bg-gray-50 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => props.onSelectProject(project)}
                  >
                    <div class="flex items-center justify-between">
                      <div>
                        <h3 class="text-lg font-medium text-gray-800">{project.name}</h3>
                        <p class="text-sm text-gray-500">
                          Last updated: {formatDate(project.updatedAt)}
                        </p>
                      </div>
                      <div class="flex items-center gap-2">
                        <button
                          class="opacity-0 group-hover:opacity-100 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-opacity"
                          onClick={(e) => deleteProject(e, project.id)}
                        >
                          Delete
                        </button>
                        <span class="text-gray-400">→</span>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectSelector