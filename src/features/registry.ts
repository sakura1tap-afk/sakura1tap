import type { ComponentType } from 'react'

export type FeatureCategory = 'game' | 'tool' | 'experiment'
export type FeatureStatus = 'available' | 'building' | 'planned'
export type FeatureAction = 'reaction' | 'lab'

export type FeatureModule = {
  action?: FeatureAction
  category: FeatureCategory
  description: string
  featured?: boolean
  id: string
  route?: string
  status: FeatureStatus
  tags: string[]
  title: string
}

export const featureCategoryOrder: FeatureCategory[] = ['game', 'tool', 'experiment']

export const featureRegistry: FeatureModule[] = [
  {
    action: 'reaction',
    category: 'game',
    description: '等待红色变绿，完成 5 次测试并计算平均反应时间。',
    featured: true,
    id: 'reaction-test',
    route: '/play/reaction',
    status: 'available',
    tags: ['反应', '计时'],
    title: '反应时间测试',
  },
  {
    category: 'game',
    description: '沿信号轨迹移动，保持连续命中。',
    id: 'signal-trace',
    status: 'planned',
    tags: ['轨迹', '节奏'],
    title: '信号追踪',
  },
  {
    category: 'tool',
    description: '组合颜色、渐变和基础材质参数。',
    id: 'color-forge',
    status: 'planned',
    tags: ['颜色', '渐变'],
    title: '颜色工坊',
  },
  {
    category: 'tool',
    description: '图片裁切、压缩与格式转换工作台。',
    id: 'image-bench',
    status: 'planned',
    tags: ['图片', '转换'],
    title: '图片工作台',
  },
  {
    category: 'tool',
    description: '格式化、校验并快速检索 JSON 路径。',
    id: 'json-lens',
    status: 'planned',
    tags: ['JSON', '开发'],
    title: 'JSON Lens',
  },
  {
    action: 'lab',
    category: 'experiment',
    description: '以可聚焦的视频窗口浏览动效片段。',
    id: 'motion-lab',
    route: '/lab',
    status: 'available',
    tags: ['Motion', 'Video'],
    title: '动效实验室',
  },
  {
    category: 'experiment',
    description: '观察鼠标轨迹、速度和粒子响应。',
    id: 'cursor-field',
    status: 'building',
    tags: ['光标', '粒子'],
    title: '光标力场',
  },
]

export const reactionFeatureLoader = () => import('./reaction/ReactionTestPage') as Promise<{
  default: ComponentType<{ onBack: () => void }>
}>
