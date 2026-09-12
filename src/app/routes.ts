export type AppPage = 'main' | 'lab' | 'play' | 'reaction'

export const APP_PATHS: Record<AppPage, string> = {
  main: '/',
  lab: '/lab',
  play: '/play',
  reaction: '/play/reaction',
}

export const PAGE_TITLES: Record<AppPage, string> = {
  main: 'Sakura1Tap',
  lab: '动效实验室 · Sakura1Tap',
  play: '功能空间 · Sakura1Tap',
  reaction: '反应时间测试 · Sakura1Tap',
}

/** Fired after a history entry was pushed so listeners can re-read the location. */
export const ROUTE_CHANGE_EVENT = 'sakura:route-change'

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

/**
 * Client-side navigation. Any component can call it instead of relying on an
 * `<a href>` full page reload; `App` re-reads the location when the event fires.
 */
export function navigateTo(page: AppPage, options: { replace?: boolean } = {}) {
  writeRoute(page, Boolean(options.replace))
  window.dispatchEvent(new CustomEvent(ROUTE_CHANGE_EVENT))
}

/**
 * Click handler for internal `<a>` elements: keeps the real href (middle-click,
 * "open in new tab", crawlers) but routes in-app for a plain left click.
 */
export function handleRouteClick(page: AppPage) {
  return (event: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; preventDefault: () => void }) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigateTo(page)
  }
}
