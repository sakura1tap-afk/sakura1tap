import HomeExperience from './home/HomeExperience'

type MainPageProps = {
  modelBuffer: ArrayBuffer | null
}

export default function MainPage({ modelBuffer }: MainPageProps) {
  void modelBuffer
  return <HomeExperience />
}
