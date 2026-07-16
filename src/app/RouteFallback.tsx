export default function RouteFallback() {
  return (
    <section
      aria-live="polite"
      style={{
        alignItems: 'center',
        background: '#050809',
        color: 'rgba(241, 238, 231, 0.72)',
        display: 'flex',
        fontSize: '0.75rem',
        inset: 0,
        justifyContent: 'center',
        letterSpacing: '0.16em',
        position: 'fixed',
      }}
    >
      正在加载
    </section>
  )
}
