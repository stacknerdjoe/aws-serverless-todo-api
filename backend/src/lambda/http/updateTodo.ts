import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { updateToDo } from '../../businessLogic/ToDo'
import { getUserId } from '../utils'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing Event ', event)

  try {
    const userId = getUserId(event)
    const todoId = event.pathParameters.todoId

    if (!event.body) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing request body' }),
      }
    }

    const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
    const toDoItem = await updateToDo(updatedTodo, todoId, userId)

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ item: toDoItem }),
    }
  } catch (e) {
    const err = e as Error
    if (err.message === 'No authentication header' || err.message === 'Invalid authentication header') {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: err.message }),
      }
    }
    if (e instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid request body' }),
      }
    }
    if (err.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Todo not found' }),
      }
    }
    console.error('Unhandled error:', e)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}
