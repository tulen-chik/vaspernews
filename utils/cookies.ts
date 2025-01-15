import { serialize, parse } from 'cookie'

export const setCookie = (name: string, value: string, options: any = {}) => {
  document.cookie = serialize(name, value, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    ...options,
  })
}

export const getCookie = (name: string) => {
  const cookies = parse(document.cookie)
  return cookies[name]
}

export const removeCookie = (name: string) => {
  document.cookie = serialize(name, '', {
    maxAge: -1,
    path: '/',
  })
}

export const getSessionFromCookie = () => {
  const sessionStr = getCookie('supabaseSession')
  return sessionStr ? JSON.parse(sessionStr) : null
}

