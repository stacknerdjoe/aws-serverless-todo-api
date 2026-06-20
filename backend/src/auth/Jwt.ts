import { JwtPayload } from './JwtPayload'

interface JwtHeader {
  alg: string
  typ?: string
  kid?: string
}

export interface Jwt {
  header: JwtHeader
  payload: JwtPayload
}
