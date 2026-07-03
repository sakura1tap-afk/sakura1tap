import type { SectionKey } from '../../data/mainSections'
import MainScene from './MainScene'

type RealmWorldStageProps = {
  active: SectionKey
  assetPhase: number
  modelBuffer: ArrayBuffer | null
  nodeOpen: boolean
}

export default function RealmWorldStage({ active, assetPhase, modelBuffer, nodeOpen }: RealmWorldStageProps) {
  return (
    <div className="realm-stage">
      <MainScene active={active} assetPhase={assetPhase} modelBuffer={modelBuffer} nodeOpen={nodeOpen} />
    </div>
  )
}
