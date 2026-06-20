import * as React from 'react'
import { Button } from 'semantic-ui-react'
import { useAuth } from 'react-oidc-context'

export function LogIn() {
  const auth = useAuth()

  return (
    <div>
      <h1>Please log in</h1>

      <Button onClick={() => auth.signinRedirect()} size="huge" color="olive">
        Log in
      </Button>
    </div>
  )
}
