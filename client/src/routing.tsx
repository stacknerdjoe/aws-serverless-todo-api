import React from 'react'
import { Router, Route, Switch } from 'react-router-dom'
import { createBrowserHistory } from 'history'
import App from './App'
import Callback from './components/Callback'

const history = createBrowserHistory()

export const makeAuthRouting = () => {
  return (
    <Router history={history}>
      <Switch>
        <Route path="/callback" component={Callback} />
        <Route component={App} />
      </Switch>
    </Router>
  )
}
