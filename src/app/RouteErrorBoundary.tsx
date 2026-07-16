import { Component, type ErrorInfo, type ReactNode } from 'react'

type RouteErrorBoundaryProps = {
  children: ReactNode
  resetKey: string
}

type RouteErrorBoundaryState = {
  hasError: boolean
}

export default class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route render failed', error, info.componentStack)
  }

  componentDidUpdate(previousProps: RouteErrorBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <section
        role="alert"
        style={{
          alignItems: 'center',
          background: '#050809',
          color: '#f1eee7',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          inset: 0,
          justifyContent: 'center',
          padding: '2rem',
          position: 'fixed',
          textAlign: 'center',
        }}
      >
        <strong>页面模块加载失败</strong>
        <span style={{ color: 'rgba(241, 238, 231, 0.58)', fontSize: '0.8rem' }}>
          可能是网络中断或网站刚刚更新。
        </span>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'transparent',
            border: '1px solid rgba(241, 238, 231, 0.3)',
            color: 'inherit',
            cursor: 'pointer',
            padding: '0.7rem 1.2rem',
          }}
          type="button"
        >
          重新加载
        </button>
      </section>
    )
  }
}
