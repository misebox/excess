import { Project, Table, View, Function, Layout } from '../models/types'

const DB_NAME = 'ExcessDB'
const DB_VERSION = 1

class Database {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' })
          projectStore.createIndex('name', 'name', { unique: false })
          projectStore.createIndex('updatedAt', 'updatedAt', { unique: false })
        }

        if (!db.objectStoreNames.contains('tables')) {
          const tableStore = db.createObjectStore('tables', { keyPath: 'id' })
          tableStore.createIndex('projectId', 'projectId', { unique: false })
          tableStore.createIndex('title', 'title', { unique: false })
        }

        if (!db.objectStoreNames.contains('views')) {
          const viewStore = db.createObjectStore('views', { keyPath: 'id' })
          viewStore.createIndex('projectId', 'projectId', { unique: false })
          viewStore.createIndex('title', 'title', { unique: false })
        }

        if (!db.objectStoreNames.contains('functions')) {
          const functionStore = db.createObjectStore('functions', { keyPath: 'id' })
          functionStore.createIndex('projectId', 'projectId', { unique: false })
          functionStore.createIndex('name', 'name', { unique: false })
        }

        if (!db.objectStoreNames.contains('layouts')) {
          const layoutStore = db.createObjectStore('layouts', { keyPath: 'id' })
          layoutStore.createIndex('projectId', 'projectId', { unique: false })
          layoutStore.createIndex('title', 'title', { unique: false })
        }
      }
    })
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized')
    const transaction = this.db.transaction([storeName], mode)
    return transaction.objectStore(storeName)
  }

  // Project methods
  async createProject(project: Project): Promise<void> {
    const store = this.getStore('projects', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.add(project)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getProject(id: string): Promise<Project | null> {
    const store = this.getStore('projects')
    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllProjects(): Promise<Project[]> {
    const store = this.getStore('projects')
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async updateProject(project: Project): Promise<void> {
    const store = this.getStore('projects', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.put(project)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async deleteProject(id: string): Promise<void> {
    // Delete project and all related data
    const stores = ['tables', 'views', 'functions', 'layouts']
    
    // Delete related items
    for (const storeName of stores) {
      await this.deleteByProjectId(storeName, id)
    }
    
    // Delete project itself
    const store = this.getStore('projects', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private async deleteByProjectId(storeName: string, projectId: string): Promise<void> {
    const store = this.getStore(storeName, 'readwrite')
    const index = store.index('projectId')
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only(projectId))
      
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  // Table methods
  async saveTable(table: Table): Promise<void> {
    const store = this.getStore('tables', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.put(table)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getTablesByProject(projectId: string): Promise<Table[]> {
    const store = this.getStore('tables')
    const index = store.index('projectId')
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(projectId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteTable(id: string): Promise<void> {
    const store = this.getStore('tables', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // View methods
  async saveView(view: View): Promise<void> {
    const store = this.getStore('views', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.put(view)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getViewsByProject(projectId: string): Promise<View[]> {
    const store = this.getStore('views')
    const index = store.index('projectId')
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(projectId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteView(id: string): Promise<void> {
    const store = this.getStore('views', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Function methods
  async saveFunction(func: Function): Promise<void> {
    const store = this.getStore('functions', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.put(func)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getFunctionsByProject(projectId: string): Promise<Function[]> {
    const store = this.getStore('functions')
    const index = store.index('projectId')
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(projectId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteFunction(id: string): Promise<void> {
    const store = this.getStore('functions', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Layout methods
  async saveLayout(layout: Layout): Promise<void> {
    const store = this.getStore('layouts', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.put(layout)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getLayoutsByProject(projectId: string): Promise<Layout[]> {
    const store = this.getStore('layouts')
    const index = store.index('projectId')
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(projectId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteLayout(id: string): Promise<void> {
    const store = this.getStore('layouts', 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export const db = new Database()