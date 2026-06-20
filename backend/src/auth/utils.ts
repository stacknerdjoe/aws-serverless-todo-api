import { JwtPayload } from './JwtPayload'

export function parseUserId(jwtToken: string): string {
  const base64Payload = jwtToken.split('.')[1]
  const decoded = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf8'))
  return (decoded as JwtPayload).sub
}

export function getToken(authHeader: string): string {
  if (!authHeader) {
    throw new Error('No authentication header')
  }
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    throw new Error('Invalid authentication header')
  }
  return authHeader.split(' ')[1]
}
