import { Component, createEffect } from 'solid-js'
import { Router, Route, Navigate, useLocation } from '@solidjs/router'
import Home from './pages/Home'
import Project from './pages/Project'
import TableDetail from './pages/TableDetail'
import ViewDetail from './pages/ViewDetail'

const withRouteLogger = (Component: any) => {
  return (props: any) => {
    const location = useLocation()
    
    createEffect(() => {
      // console.debug('URL changed:', {
      //   pathname: location.pathname,
      //   search: location.search,
      //   hash: location.hash,
      //   fullUrl: location.pathname + location.search + location.hash,
      //   timestamp: new Date().toISOString()
      // })
    })
    
    return <Component {...props} />
  }
}

const App: Component = () => {
  return (
    <Router>
      <Route path="/" component={withRouteLogger(Home)} />
      <Route path="/projects/:projectId" component={withRouteLogger(Project)} />
      <Route path="/projects/:projectId/tables/:tableId" component={withRouteLogger(TableDetail)} />
      <Route path="/projects/:projectId/views/:viewId" component={withRouteLogger(ViewDetail)} />
      <Route path="/projects/:projectId/functions/:functionId" component={withRouteLogger(Project)} />
      <Route path="/projects/:projectId/layouts/:layoutId" component={withRouteLogger(Project)} />
      <Route path="*" component={() => <Navigate href="/" />} />
    </Router>
  )
}

export default App