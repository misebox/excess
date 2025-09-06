import { Component, createSignal, Show } from 'solid-js'
import { CommonDialog, Button } from './common'

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

  const footer = (
    <div class="flex justify-between">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowReplace(!showReplace())}
      >
        {showReplace() ? 'Hide Replace' : 'Show Replace'}
      </Button>
      <div class="flex gap-2">
        <Show when={showReplace()}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReplace}
          >
            Replace
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReplaceAll}
          >
            Replace All
          </Button>
        </Show>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSearch}
        >
          Find
        </Button>
      </div>
    </div>
  )

  return (
    <CommonDialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={showReplace() ? 'Find and Replace' : 'Find'}
      maxWidth="max-w-md"
      footer={footer}
    >
      <div onKeyDown={handleKeyDown}>

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
      </div>
    </CommonDialog>
  )
}

export default SearchDialog