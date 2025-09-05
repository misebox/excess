import { Component } from 'solid-js'
import { Router, Route, Navigate } from '@solidjs/router'
import Home from './pages/Home'
import Project from './pages/Project'
import TableDetail from './pages/TableDetail'

const App: Component = () => {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/projects/:projectId" component={Project} />
      <Route path="/projects/:projectId/tables/:tableId" component={TableDetail} />
      <Route path="/projects/:projectId/views/:viewId" component={Project} />
      <Route path="/projects/:projectId/functions/:functionId" component={Project} />
      <Route path="/projects/:projectId/layouts/:layoutId" component={Project} />
      <Route path="*" component={() => <Navigate href="/" />} />
    </Router>
  )
}

export default App