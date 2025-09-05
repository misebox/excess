import { Component, createSignal, Show } from 'solid-js'

interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (searchTerm: string, options: SearchOptions) => void
  onReplace: (searchTerm: string, replaceTerm: string, options: SearchOptions) => void
  onReplaceAll: (searchTerm: string, replaceTerm: string, options: SearchOptions) => void
}

export interface SearchOptions {
  caseSensitive: boolean
  wholeWord: boolean
  useRegex: boolean
  searchInSelection: boolean
}

const SearchDialog: Component<SearchDialogProps> = (props) => {
  const [searchTerm, setSearchTerm] = createSignal('')
  const [replaceTerm, setReplaceTerm] = createSignal('')
  const [caseSensitive, setCaseSensitive] = createSignal(false)
  const [wholeWord, setWholeWord] = createSignal(false)
  const [useRegex, setUseRegex] = createSignal(false)
  const [searchInSelection, setSearchInSelection] = createSignal(false)
  const [showReplace, setShowReplace] = createSignal(false)

  const getOptions = (): SearchOptions => ({
    caseSensitive: caseSensitive(),
    wholeWord: wholeWord(),
    useRegex: useRegex(),
    searchInSelection: searchInSelection()
  })

  const handleSearch = () => {
    if (searchTerm()) {
      props.onSearch(searchTerm(), getOptions())
    }
  }

  const handleReplace = () => {
    if (searchTerm()) {
      props.onReplace(searchTerm(), replaceTerm(), getOptions())
    }
  }

  const handleReplaceAll = () => {
    if (searchTerm()) {
      props.onReplaceAll(searchTerm(), replaceTerm(), getOptions())
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      props.onClose()
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  if (!props.isOpen) return null

  return (
    <div class="fixed inset-0 bg-black bg-opacity-25 flex items-start justify-center pt-20 z-50">
      <div 
        class="bg-white rounded-lg shadow-xl p-4 w-96 max-w-full"
        onKeyDown={handleKeyDown}
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">
            {showReplace() ? 'Find and Replace' : 'Find'}
          </h3>
          <button
            class="text-gray-500 hover:text-gray-700 text-xl"
            onClick={props.onClose}
          >
            ×
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium mb-1">Find</label>
            <input
              type="text"
              class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm()}
              onInput={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter search term"
              autofocus
            />
          </div>

          <Show when={showReplace()}>
            <div>
              <label class="block text-sm font-medium mb-1">Replace with</label>
              <input
                type="text"
                class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={replaceTerm()}
                onInput={(e) => setReplaceTerm(e.target.value)}
                placeholder="Enter replacement text"
              />
            </div>
          </Show>

          <div class="flex items-center gap-4 text-sm">
            <label class="flex items-center">
              <input
                type="checkbox"
                class="mr-1.5"
                checked={caseSensitive()}
                onChange={(e) => setCaseSensitive(e.target.checked)}
              />
              Case sensitive
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                class="mr-1.5"
                checked={wholeWord()}
                onChange={(e) => setWholeWord(e.target.checked)}
              />
              Whole word
            </label>
          </div>

          <div class="flex items-center gap-4 text-sm">
            <label class="flex items-center">
              <input
                type="checkbox"
                class="mr-1.5"
                checked={useRegex()}
                onChange={(e) => setUseRegex(e.target.checked)}
              />
              Use regex
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                class="mr-1.5"
                checked={searchInSelection()}
                onChange={(e) => setSearchInSelection(e.target.checked)}
              />
              In selection
            </label>
          </div>
        </div>

        <div class="flex items-center justify-between mt-4 pt-3 border-t">
          <button
            class="text-sm text-blue-600 hover:text-blue-700"
            onClick={() => setShowReplace(!showReplace())}
          >
            {showReplace() ? 'Hide Replace' : 'Show Replace'}
          </button>

          <div class="flex items-center gap-2">
            <Show when={showReplace()}>
              <button
                class="px-3 py-1.5 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={handleReplace}
              >
                Replace
              </button>
              <button
                class="px-3 py-1.5 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={handleReplaceAll}
              >
                Replace All
              </button>
            </Show>
            <button
              class="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleSearch}
            >
              Find Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchDialog