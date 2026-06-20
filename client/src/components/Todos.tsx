import dateFormat from 'dateformat'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'
import { useHistory } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'

import { createTodo, deleteTodo, getTodos, patchTodo } from '../api/todos-api'
import { Todo } from '../types/Todo'

export function Todos() {
  const auth = useAuth()
  const history = useHistory()
  const [todos, setTodos] = React.useState<Todo[]>([])
  const [newTodoName, setNewTodoName] = React.useState('')
  const [loadingTodos, setLoadingTodos] = React.useState(true)

  React.useEffect(() => {
    const fetchTodos = async () => {
      try {
        const items = await getTodos(auth.user!.access_token)
        setTodos(items)
        setLoadingTodos(false)
      } catch (e) {
        alert(`Failed to fetch todos: ${e.message}`)
      }
    }
    fetchTodos()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount; auth.user is guaranteed non-null (App guards with isAuthenticated)

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewTodoName(event.target.value)
  }

  const onEditButtonClick = (todoId: string) => {
    history.push(`/todos/${todoId}/edit`)
  }

  const onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = calculateDueDate()
      const newTodo = await createTodo(auth.user!.access_token, {
        name: newTodoName,
        dueDate
      })
      setTodos([...todos, newTodo])
      setNewTodoName('')
    } catch {
      alert('Todo creation failed')
    }
  }

  const onTodoDelete = async (todoId: string) => {
    try {
      await deleteTodo(auth.user!.access_token, todoId)
      setTodos(todos.filter(todo => todo.todoId !== todoId))
    } catch {
      alert('Todo deletion failed')
    }
  }

  const onTodoCheck = async (pos: number) => {
    try {
      const todo = todos[pos]
      await patchTodo(auth.user!.access_token, todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done
      })
      setTodos(update(todos, {
        [pos]: { done: { $set: !todo.done } }
      }))
    } catch {
      alert('Todo update failed')
    }
  }

  const calculateDueDate = (): string => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return dateFormat(date, 'yyyy-mm-dd') as string
  }

  const renderCreateTodoInput = () => {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New task',
              onClick: onTodoCreate
            }}
            fluid
            actionPosition="left"
            placeholder="To change the world..."
            onChange={handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  const renderLoading = () => {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  const renderTodosList = () => {
    return (
      <Grid padded>
        {todos.map((todo, pos) => {
          return (
            <Grid.Row key={todo.todoId}>
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => onTodoCheck(pos)}
                  checked={todo.done}
                />
              </Grid.Column>
              <Grid.Column width={10} verticalAlign="middle">
                {todo.name}
              </Grid.Column>
              <Grid.Column width={3} floated="right">
                {todo.dueDate}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => onEditButtonClick(todo.todoId)}
                >
                  <Icon name="pencil" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => onTodoDelete(todo.todoId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {todo.attachmentUrl && (
                <Image src={todo.attachmentUrl} size="small" wrapped />
              )}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  return (
    <div>
      <Header as="h1">TODOs</Header>

      {renderCreateTodoInput()}

      {loadingTodos ? renderLoading() : renderTodosList()}
    </div>
  )
}
