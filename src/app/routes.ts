export type AppPage = 'main' | 'lab' | 'play' | 'reaction'

export const APP_PATHS: Record<AppPage, string> = {
  main: '/',
  lab: '/lab',
  play: '/play',
  reaction: '/play/reaction',
}

export function normalizePath(pathname: string) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
}

export function getPageFromPath(pathname: string): AppPage {
  const normalizedPath = normalizePath(pathname)

  if (normalizedPath === APP_PATHS.lab) return 'lab'
  if (normalizedPath === APP_PATHS.reaction) return 'reaction'
  if (normalizedPath === APP_PATHS.play) return 'play'
  return 'main'
}

export function writeRoute(page: AppPage, replace = false) {
  const method = replace ? 'replaceState' : 'pushState'
  window.history[method]({}, '', APP_PATHS[page])
}
