import { APIGatewayProxyEvent } from 'aws-lambda'
import { parseUserId, getToken } from '../auth/utils'

export function getUserId(event: APIGatewayProxyEvent): string {
  const jwtToken = getToken(event.headers.Authorization)
  return parseUserId(jwtToken)
}
