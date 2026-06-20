import { apiEndpoint } from '../config'
import { Todo } from '../types/Todo';
import { CreateTodoRequest } from '../types/CreateTodoRequest';
import Axios from 'axios'
import { UpdateTodoRequest } from '../types/UpdateTodoRequest';

export async function getTodos(accessToken: string): Promise<Todo[]> {
  console.log('Fetching todos')

  const response = await Axios.get(`${apiEndpoint}/todos`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
  })
  console.log('Todos:', response.data)
  return response.data.items
}

export async function createTodo(
  accessToken: string,
  newTodo: CreateTodoRequest
): Promise<Todo> {
  const response = await Axios.post(`${apiEndpoint}/todos`, JSON.stringify(newTodo), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  })
  return response.data.item
}

export async function patchTodo(
  accessToken: string,
  todoId: string,
  updatedTodo: UpdateTodoRequest
): Promise<void> {
  await Axios.patch(`${apiEndpoint}/todos/${todoId}`, JSON.stringify(updatedTodo), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  })
}

export async function deleteTodo(
  accessToken: string,
  todoId: string
): Promise<void> {
  await Axios.delete(`${apiEndpoint}/todos/${todoId}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  })
}

export async function getUploadUrl(
  accessToken: string,
  todoId: string
): Promise<string> {
  try {
    const response = await Axios.post(`${apiEndpoint}/todos/${todoId}/attachment`, '', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    })
    return response.data.uploadUrl
  } catch (err) {
    console.error('get upload url', err)
  }
  return ''
}

export async function uploadFile(uploadUrl: string, file: File): Promise<void> {
  try {
    await Axios.put(uploadUrl, file)
  } catch (err) {
    console.error('Upload file', err)
  }
}
