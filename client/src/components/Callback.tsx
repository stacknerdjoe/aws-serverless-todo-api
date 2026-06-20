import React, { useEffect } from 'react'
import { Dimmer, Loader } from 'semantic-ui-react'
import { useAuth } from 'react-oidc-context'
import { useHistory } from 'react-router-dom'

function Callback() {
  const auth = useAuth()
  const history = useHistory()

  useEffect(() => {
    if (!auth.isLoading) {
      history.replace('/')
    }
  }, [auth.isLoading, history])

  return (
    <Dimmer active>
      <Loader content="Loading" />
    </Dimmer>
  )
}

export default Callback
