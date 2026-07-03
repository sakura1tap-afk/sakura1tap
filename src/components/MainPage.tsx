import MainExperience from './main/MainExperience'

type MainPageProps = {
  modelBuffer: ArrayBuffer | null
}

export default function MainPage({ modelBuffer }: MainPageProps) {
  return <MainExperience modelBuffer={modelBuffer} />
}
