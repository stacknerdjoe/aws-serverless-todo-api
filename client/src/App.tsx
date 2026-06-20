import React from 'react'
import { Link, Route, Switch } from 'react-router-dom'
import { Dimmer, Grid, Loader, Menu, Segment } from 'semantic-ui-react'
import { useAuth } from 'react-oidc-context'

import { EditTodo } from './components/EditTodo'
import { LogIn } from './components/LogIn'
import { NotFound } from './components/NotFound'
import { Todos } from './components/Todos'

export default function App() {
  const auth = useAuth()

  if (auth.isLoading) {
    return (
      <Dimmer active>
        <Loader content="Loading" />
      </Dimmer>
    )
  }

  return (
    <div>
      <Segment style={{ padding: '8em 0em' }} vertical>
        <Grid container stackable verticalAlign="middle">
          <Grid.Row>
            <Grid.Column width={16}>
              <Menu>
                <Menu.Item name="home">
                  <Link to="/">Home</Link>
                </Menu.Item>

                <Menu.Menu position="right">
                  {auth.isAuthenticated ? (
                    <Menu.Item name="logout" onClick={() => auth.removeUser()}>
                      Log Out
                    </Menu.Item>
                  ) : (
                    <Menu.Item name="login" onClick={() => auth.signinRedirect()}>
                      Log In
                    </Menu.Item>
                  )}
                </Menu.Menu>
              </Menu>

              {auth.isAuthenticated ? (
                <Switch>
                  <Route path="/" exact component={Todos} />
                  <Route path="/todos/:todoId/edit" exact component={EditTodo} />
                  <Route component={NotFound} />
                </Switch>
              ) : (
                <LogIn />
              )}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Segment>
    </div>
  )
}
