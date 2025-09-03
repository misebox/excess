import { Component, For } from 'solid-js'
import { Tab, TabType } from '../models/types'

interface TabBarProps {
  tabs: Tab[]
  activeTabId: string | null
  onTabSelect: (id: string) => void
  onTabClose: (id: string) => void
  onNewTab: (type: TabType) => void
}

const TabBar: Component<TabBarProps> = (props) => {
  const tabTypeIcons = {
    table: '⊞',
    view: '👁',
    function: 'ƒ',
    layout: '▦'
  }

  return (
    <div class="flex items-center gap-1 bg-gray-100 p-1 border-b">
      <For each={props.tabs}>
        {(tab) => (
          <div
            class={`flex items-center gap-2 px-3 py-1.5 rounded-t cursor-pointer transition-colors ${
              props.activeTabId === tab.id
                ? 'bg-white border border-b-0'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => props.onTabSelect(tab.id)}
          >
            <span class="text-sm">{tabTypeIcons[tab.type]}</span>
            <span class="text-sm">{tab.title}</span>
            <button
              class="ml-2 text-gray-500 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation()
                props.onTabClose(tab.id)
              }}
            >
              ×
            </button>
          </div>
        )}
      </For>
      
      <div class="flex gap-1 ml-2">
        <button
          class="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => props.onNewTab('table')}
        >
          +Table
        </button>
        <button
          class="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          onClick={() => props.onNewTab('view')}
        >
          +View
        </button>
        <button
          class="px-2 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
          onClick={() => props.onNewTab('function')}
        >
          +Function
        </button>
        <button
          class="px-2 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
          onClick={() => props.onNewTab('layout')}
        >
          +Layout
        </button>
      </div>
    </div>
  )
}

export default TabBar