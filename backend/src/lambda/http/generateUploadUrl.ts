import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { generateUploadUrl } from '../../businessLogic/ToDo'
import { getUserId } from '../utils'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing Event ', event)

  try {
    const userId = getUserId(event)
    const todoId = event.pathParameters.todoId
    const uploadUrl = await generateUploadUrl(todoId, userId)

    return {
      statusCode: 202,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ uploadUrl }),
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
