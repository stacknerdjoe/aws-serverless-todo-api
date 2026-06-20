import React from 'react'
import ReactDOM from 'react-dom'
import { AuthProvider } from 'react-oidc-context'
import './index.css'
import * as serviceWorker from './serviceWorker'
import 'semantic-ui-css/semantic.min.css'
import { makeAuthRouting } from './routing'

const oidcConfig = {
  authority: process.env.REACT_APP_COGNITO_AUTHORITY!,
  client_id: process.env.REACT_APP_COGNITO_CLIENT_ID!,
  redirect_uri: process.env.REACT_APP_REDIRECT_URI!,
  response_type: 'code',
  scope: 'openid email profile',
}

ReactDOM.render(
  <AuthProvider {...oidcConfig}>
    {makeAuthRouting()}
  </AuthProvider>,
  document.getElementById('root')
)

serviceWorker.unregister()
