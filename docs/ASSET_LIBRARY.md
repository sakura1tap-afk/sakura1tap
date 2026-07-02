# Sakura1Tap Asset Library

> 本文档记录项目素材来源、用途、体积风险和当前处理状态。  
> 新素材进入实现前，应先在这里登记，避免后续不知道素材从哪里来、能不能用、该放在哪一层。

## 1. Rules

- 优先使用 CC0、公共领域或明确允许商用/改编的素材。
- 非 CC0 素材必须记录作者、来源链接、许可证和署名要求。
- 不把未经确认授权的角色/IP 模型放入公开页面。
- 大体积素材先作为设计候选，不直接进入首屏加载。
- `.blend.zip`、`.exr`、高分辨率贴图应先转换、压缩或降级后再进入 `public/` 正式路径。

## 2. Current Candidate Assets

| Asset | Type | Size | Suggested use | Status | Notes |
| --- | --- | ---: | --- | --- | --- |
| `素材库/dna_hologram.glb` -> `public/art/models/dna_hologram.glb` | GLB model | 9.6 MB | Main scene hologram, Source node, identity motif | active | 已作为 Main Scene 懒加载 genome hologram 接入；保留程序化 DNA fallback，后续仍建议做 glTF 压缩。 |
| `素材库/dark_rock_4k.blend.zip` | Blender + texture set | 66.7 MB | Dark stone base, ink-rock material, main scene ground | candidate | 包含 diff/disp/normal/rough；建议只导出低分辨率贴图或烘焙为 lightweight material。 |
| `素材库/rogland_clear_night_4k.exr` | HDRI / EXR | 97.1 MB | Dark environment lighting | candidate | 体积过大，不可直接首屏使用；需要 1k/2k 版本或转换为轻量环境贴图。 |
| `素材库/gothic_statue_4k.blend.zip` | Blender + texture set | 39.1 MB | Source archive, distant silhouette, artifact room | candidate | 适合“档案馆/遗迹”气质；不建议直接首屏加载。 |
| `素材库/chinese_chandelier_4k.blend.zip` | Blender + texture set | 29.6 MB | Oriental cyber ritual light, Source/Entry visual accent | candidate | 可作为中式冷光元素参考；需要低模/贴图降级。 |
| `素材库/cc0___sakura_cherry_blossom.glb` | GLB model | 77.5 MB | Sakura motif reference, particle source | candidate | 文件过重；建议不直接加载，改用程序化花瓣或导出少量局部。 |
| `素材库/2d_hand_creation_rigged.glb` | GLB model | 5.0 MB | Creator hand, Work/Play interaction experiment | candidate | 有创意但容易偏离主视觉；适合后期彩蛋或 Play 实验。 |
| `素材库/simple_rigged_stickman_for_2d_animations.glb` | GLB model | 0.27 MB | Play prototype, interactive lab marker | candidate | 体积轻，但风格偏实验，不适合主页面主视觉。 |
| `素材库/anime_girl_with_red_hoodie.glb` | GLB model | 9.7 MB | Anime style reference only | license-check | 公开使用前必须确认授权和来源。 |
| `素材库/anime_head_-_mako_kill_la_kill.glb` | GLB model | 3.0 MB | Do not ship without license review | blocked | 文件名疑似包含既有 IP；不建议进入公开页面。 |
| `素材库/stella.glb` | GLB model | 13.7 MB | Anime style reference only | license-check | 公开使用前必须确认授权和来源。 |
| `public/images/fantasy-road.png` | PNG background | 3.1 MB | Current entry background | active | 后续可压缩为 WebP/AVIF 候选。 |
| `public/models/study.glb` | GLB model | 3.6 MB | Current main scene model | active | CC BY 4.0，已有 attribution 文件。 |
| `public/live2d/WhiteAngelOriginal` | Live2D model | mixed | Entry identity, possible assistant/guide | active | 当前入口主模型之一，保留为核心身份资产。 |
| `public/live2d/Fern` | Live2D model | mixed | Entry identity, possible mood layer | active | 当前入口模型之一，需注意体积和授权记录。 |
| `public/live2d/Frieren` | Live2D model | mixed | Candidate / inactive model | license-check | 若公开使用，需确认授权。 |

## 3. Recommended Asset Path

未来整理后建议采用：

```text
public/
├─ art/
│  ├─ textures/
│  ├─ hdri/
│  ├─ models/
│  └─ particles/
├─ images/
├─ live2d/
└─ models/
```

当前 `素材库/` 作为候选素材暂存区，不直接等同于生产资源目录。

Runtime asset interface:

- `src/assets/assetManifest.ts` now records active and candidate asset ids, kind, loading tier, status, source path, and optional public URL.
- Components should use the manifest for future asset decisions instead of scattering raw paths.
- `public/art/ASSET_SOURCES.md` records runtime copies moved from the staging library into deployable paths.

## 4. First Production Candidates

第一批适合进入实现评估的素材：

1. `dna_hologram.glb`：已进入主场景懒加载；下一步做 glTF 压缩和视觉尺寸微调。
2. `dark_rock` 贴图：导出低分辨率黑色岩石/水墨材质。
3. `rogland_clear_night`：找或生成低分辨率环境光版本；当前先用冷暖交叉灯光模拟夜景气质。
4. 程序化樱花粒子：不要直接加载 77MB 樱花模型。
5. Live2D 入口资产：保持现有入口身份，不在主页面第一阶段重新搬迁。
