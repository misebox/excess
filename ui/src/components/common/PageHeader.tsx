import { Component, JSX, Show } from 'solid-js'
import { A } from '@solidjs/router'

interface PageHeaderProps {
  title: string
  backLink?: {
    href: string
    label: string
  }
  actions?: JSX.Element
}

const PageHeader: Component<PageHeaderProps> = (props) => {
  return (
    <header class="bg-white shadow-sm border-b flex items-center justify-between px-4 py-2">
      <div class="flex items-center gap-4">
        <Show when={props.backLink}>
          <A href={props.backLink!.href} class="text-blue-600 hover:text-blue-700">
            {props.backLink!.label}
          </A>
        </Show>
        <h1 class="text-xl font-semibold">{props.title}</h1>
      </div>
      
      <Show when={props.actions}>
        <div class="flex items-center gap-2">
          {props.actions}
        </div>
      </Show>
    </header>
  )
}

export default PageHeader