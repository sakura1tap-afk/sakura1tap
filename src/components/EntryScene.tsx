import { Canvas } from '@react-three/fiber'
import { Environment, Html, OrbitControls } from '@react-three/drei'
import { Component, Suspense, type ErrorInfo, type ReactNode } from 'react'
import { useEffect, useState } from 'react'
import StudyModel from './StudyModel'
import SketchfabFallback from './SketchfabFallback'

type ModelBoundaryProps = {
  children: ReactNode
}

type ModelBoundaryState = {
  hasError: boolean
}

class ModelBoundary extends Component<ModelBoundaryProps, ModelBoundaryState> {
  state: ModelBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('Study model failed to load.', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Html center className="model-status">
          模型文件未找到
        </Html>
      )
    }

    return this.props.children
  }
}

export default function EntryScene() {
  return (
    <div className="scene-wrap" aria-hidden="true">
      <ModelExperience />
    </div>
  )
}

function ModelExperience() {
  const modelPath = '/models/study.glb'
  const modelState = useModelAvailability(modelPath)

  if (modelState === 'checking') {
    return <div className="model-status model-status-plain">loading</div>
  }

  if (modelState === 'missing') {
    return <SketchfabFallback />
  }

  return (
    <Canvas
      camera={{ position: [0, 1.2, 4.6], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#07080b']} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 6, 4]} intensity={1.8} />
      <directionalLight position={[-3, 2, -4]} intensity={0.55} color="#b7c7ff" />

      <Suspense
        fallback={
          <Html center className="model-status">
            loading
          </Html>
        }
      >
        <ModelBoundary>
          <StudyModel />
        </ModelBoundary>
        <Environment preset="city" />
      </Suspense>

      <OrbitControls
        makeDefault
        autoRotate
        autoRotateSpeed={0.55}
        enableDamping
        dampingFactor={0.06}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.82}
      />
    </Canvas>
  )
}

function useModelAvailability(modelPath: string) {
  const [modelState, setModelState] = useState<'checking' | 'ready' | 'missing'>('checking')

  useEffect(() => {
    let alive = true

    fetch(modelPath, { method: 'HEAD', cache: 'no-store' })
      .then((response) => {
        if (alive) {
          const contentType = response.headers.get('content-type') ?? ''
          const isHtmlFallback = contentType.includes('text/html')

          setModelState(response.ok && !isHtmlFallback ? 'ready' : 'missing')
        }
      })
      .catch(() => {
        if (alive) {
          setModelState('missing')
        }
      })

    return () => {
      alive = false
    }
  }, [modelPath])

  return modelState
}
