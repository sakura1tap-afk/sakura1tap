const FELIX_EMBED_URL =
  'https://sketchfab.com/models/6c6fa5c8512a4659a37469f869199b1b/embed?autostart=1&preload=1&ui_infos=0&ui_controls=1&ui_theme=dark'

export default function SketchfabFallback() {
  return (
    <div className="sketchfab-stage">
      <iframe
        title="Felix The Cat"
        src={FELIX_EMBED_URL}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
      />
    </div>
  )
}
