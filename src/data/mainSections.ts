import { BookOpen, BriefcaseBusiness, Globe2, Home, Info, type LucideIcon } from 'lucide-react'

export type SectionKey = 'home' | 'universe' | 'portfolio' | 'blog' | 'about'

export type DetailCard = {
  body: string
  label: string
  meta: string
}

export type SectionConfig = {
  accent: string
  body: string
  camera: [number, number, number]
  details: DetailCard[]
  hotspot: { left: string; top: string }
  icon: LucideIcon
  label: string
  metric: string
  modelRotation: [number, number, number]
  orbit: [number, number, number]
  title: string
}

export const mainSections: Record<SectionKey, SectionConfig> = {
  home: {
    accent: '#d4af37',
    body: '从森林边境进入一座个人幻想王国：项目、文章、世界观和互动实验都藏在这片光影里。',
    camera: [0.18, 1.08, 4.15],
    details: [
      { label: 'REALM', meta: 'forest gate', body: '首页负责建立氛围：远山、森林、城堡、柔光、玻璃面板和低频动效。' },
      { label: 'RHYTHM', meta: 'calm entry', body: '首屏不堆满功能，先让访问者感到进入了一个世界。' },
      { label: 'ACTION', meta: 'guided scroll', body: '后续使用 GSAP 时间线把进入、浏览和离开组织成连续体验。' },
    ],
    hotspot: { left: '50%', top: '52%' },
    icon: Home,
    label: 'HOME',
    metric: '01 / FOREST GATE',
    modelRotation: [0, -0.12, 0],
    orbit: [-0.08, 0.06, 0],
    title: 'Enter the Realm',
  },
  universe: {
    accent: '#9fb7c8',
    body: 'Universe 承载多世界设定：森林、道路、城堡、遗迹与未来的 3D/2D 世界节点。',
    camera: [-1.18, 1.06, 3.95],
    details: [
      { label: 'WORLD', meta: '3d / 2d map', body: '这里应像世界地图，不是普通栏目页。节点可以进入森林、道路、城市或世界观短篇。' },
      { label: 'MOTION', meta: 'camera drift', body: '镜头移动应轻微、缓慢、有景深，避免科技感控制台式旋转。' },
      { label: 'ASSET', meta: 'environment first', body: '优先使用背景、光影、雾和低成本模型制造深度，不先堆大模型。' },
    ],
    hotspot: { left: '42%', top: '48%' },
    icon: Globe2,
    label: 'UNIVERSE',
    metric: '02 / WORLD MAP',
    modelRotation: [0, 0.26, 0],
    orbit: [0.08, -0.08, 0.2],
    title: 'World Atlas',
  },
  portfolio: {
    accent: '#f5f5f5',
    body: 'Portfolio 展示作品，不做厚重后台，而是像冒险日志里的卡片与详情页。',
    camera: [1.22, 1.12, 3.88],
    details: [
      { label: 'WORKS', meta: 'cards and detail', body: '每个项目用一张玻璃卡片进入，详情页记录目标、技术栈、截图和结果。' },
      { label: 'FILTER', meta: 'hover light', body: '悬停时使用微光、阴影和轻滚动，不使用过强霓虹效果。' },
      { label: 'PROOF', meta: 'student portfolio', body: '展示应适合答辩/作品集阅读：少废话，重过程和完成度。' },
    ],
    hotspot: { left: '58%', top: '55%' },
    icon: BriefcaseBusiness,
    label: 'PORTFOLIO',
    metric: '03 / WORK ARCHIVE',
    modelRotation: [0, -0.42, 0],
    orbit: [0.14, 0.1, -0.12],
    title: 'Adventurer Logs',
  },
  blog: {
    accent: '#a8aaa8',
    body: 'Blog 是文章列表和详情，视觉上像羊皮纸、手稿和旅途记录。',
    camera: [0.72, 0.98, 4.32],
    details: [
      { label: 'WRITING', meta: 'notes and essays', body: '文章页可以承载学习记录、设计决策、技术踩坑和项目复盘。' },
      { label: 'READING', meta: 'calm scroll', body: '滚动要平稳，正文区清晰，背景只提供氛围，不抢阅读。' },
      { label: 'SYSTEM', meta: 'future markdown', body: '后续可以接 Markdown 内容源和分类归档。' },
    ],
    hotspot: { left: '52%', top: '65%' },
    icon: BookOpen,
    label: 'BLOG',
    metric: '04 / CHRONICLE',
    modelRotation: [0, 0.08, 0],
    orbit: [-0.18, 0, -0.16],
    title: 'Chronicles',
  },
  about: {
    accent: '#d4af37',
    body: 'About 说明站点主人、联系方式和这个网站的创作方向。',
    camera: [0.08, 1.16, 4.02],
    details: [
      { label: 'PROFILE', meta: 'creator identity', body: '这里放真实个人介绍、学习方向、技能栈和联系方式。' },
      { label: 'STACK', meta: 'react / three / gsap', body: '技术说明保留，但要服务于作品集叙事，不做技术清单堆叠。' },
      { label: 'CONTACT', meta: 'reach out', body: '后续加入 GitHub、邮箱、社交链接和简历入口。' },
    ],
    hotspot: { left: '47%', top: '36%' },
    icon: Info,
    label: 'ABOUT',
    metric: '05 / CREATOR',
    modelRotation: [0, -0.2, 0],
    orbit: [0.04, 0.12, 0],
    title: 'The Keeper',
  },
}

export const sectionOrder = Object.keys(mainSections) as SectionKey[]
