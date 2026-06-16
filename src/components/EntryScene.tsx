import { Canvas } from '@react-three/fiber'
import { Environment, Html, OrbitControls } from '@react-three/drei'
import { Component, Suspense, type ErrorInfo, type ReactNode } from 'react'
import type { BackgroundTone, ViewMode } from './EntryControls'
import StudyModel from './StudyModel'

type EntrySceneProps = {
  autoRotate: boolean
  backgroundTone: BackgroundTone
  modelUrl: string
  softLight: boolean
  viewMode: ViewMode
}

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

const sceneBackgrounds: Record<BackgroundTone, string> = {
  mist: '#f2e8ec',
  paper: '#ece9df',
  warm: '#f0e7d9',
}

export default function EntryScene({ autoRotate, backgroundTone, modelUrl, softLight, viewMode }: EntrySceneProps) {
  return (
    <div className="scene-wrap" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 1.28, 4.7], fov: 36 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={[sceneBackgrounds[backgroundTone]]} />
        <ambientLight intensity={softLight ? 0.96 : 0.72} />
        <directionalLight position={[4, 6, 4]} intensity={softLight ? 1.35 : 1.05} />
        <directionalLight position={[-3, 2, -4]} intensity={softLight ? 0.48 : 0.3} color="#d9e3ff" />

        <Suspense
          fallback={
            <Html center className="model-status">
              loading
            </Html>
          }
        >
          <ModelBoundary>
            <StudyModel modelUrl={modelUrl} viewMode={viewMode} />
          </ModelBoundary>
          <Environment preset="city" />
        </Suspense>

        <OrbitControls
          makeDefault
          autoRotate={autoRotate}
          autoRotateSpeed={0.55}
          enableDamping
          dampingFactor={0.06}
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI * 0.18}
          maxPolarAngle={Math.PI * 0.82}
          target={[0, 0.22, 0]}
        />
      </Canvas>
    </div>
  )
}
