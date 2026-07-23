# 小逻 · 微表情导演工作室

一套面向影视表演、角色动画与 AI 视频提示词设计的微表情编排工具。项目将二维情绪定位、FaceCap 3D 假人、演员情绪预设、精细面部控制、关键帧时间轴和视频录制整合在同一个工作台中。

> 当前版本定位为可运行的交互原型。主预览区使用可实时驱动的低精度 FaceCap 3D 模型；预设卡片中的高精度人像用于展示目标情绪和表情参考，两者不是同一套渲染资产。
>
> <img width="1347" height="1332" alt="a45464b78bfea040c46259217115e63e" src="https://github.com/user-attachments/assets/1e7f5634-c038-4f19-ad86-0876a963d606" />


## 主要功能

- **二维情绪定位**：在“亲近—疏离、平静—激动”坐标中快速确定表演方向。
- **男女模型切换**：可分别选择男性或女性假人进行表演预览。
- **实时 3D 面部驱动**：基于 Three.js 和 FaceCap 52 Blendshape/Morph Target 模型实时改变眼睛、眉毛、嘴部与头部姿态。
- **25 个演员情绪预设**：覆盖平静、正向、负向及高级角色情绪，并提供直观的高精度参考缩略图。
- **精细微表情控制**：调整睁眼程度、视线、聚焦、眉毛高度与张力、嘴角、嘴部紧张度、头部倾斜、呼吸等参数。
- **表演动画时间轴**：添加、选择、拖动和删除关键帧，在关键帧之间平滑插值并播放表情动画。
- **AI Prompt 生成**：将情绪坐标和面部参数转换为角色表演、镜头及视频运动提示词。
- **WebM 视频录制**：支持 5、10、15、30 秒时长及 720p、1080p 清晰度档位。
- **网格辅助显示**：可在主视图中查看模型网格，方便检查面部变形。

## 技术栈

- React 19 + TypeScript
- Vite 6 + Tailwind CSS 4
- Three.js
- Zustand
- Motion
- Express
- Google GenAI SDK

## 快速开始

### 环境要求

- Node.js 20 或更高版本
- npm
- 推荐使用最新版 Chrome、Edge 等 Chromium 浏览器

### 1. 获取并安装项目

```bash
git clone https://github.com/zhurui0523/XiaoLuo-emotion-director-studio.git
cd XiaoLuo-emotion-director-studio
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`，并填写：

```env
GEMINI_API_KEY="你的 Gemini API Key"
APP_URL="http://localhost:3000"
```

`GEMINI_API_KEY` 用于 AI Prompt 生成功能。没有密钥时，3D 模型、表情预设、面部参数、时间轴等本地功能仍可使用，服务端也包含基础提示词回退逻辑。

### 3. 启动开发环境

```bash
npm run dev
```

浏览器访问：<http://localhost:3000>

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 使用流程

1. 在右侧情绪矩阵中选择情绪强度，或直接点击一个演员情绪预设。
2. 在主预览区底部选择男性或女性模型。
3. 打开“面部微表情解剖”，继续调整眼神、眉毛、嘴部、呼吸和姿态。
4. 打开“表演动画时间轴”，添加关键帧并拖动关键帧改变出现时间。
5. 播放动画检查表情过渡；选中关键帧后可以删除。
6. 根据需要生成 AI Prompt，或录制并导出 WebM 视频。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run lint` | 执行 TypeScript 类型检查 |
| `npm run build` | 构建前端并打包服务端 |
| `npm start` | 启动生产版本 |
| `npm run preview` | 预览 Vite 构建结果 |

## 项目结构

```text
.
├─ public/
│  ├─ models/                         # FaceCap 3D 模型
│  ├─ expression-preset-sheet-*.png   # 高精度预设参考图
│  └─ basis/                          # Three.js 纹理解码资源
├─ src/
│  ├─ components/                     # 预览、参数、预设、时间轴等组件
│  ├─ store/                          # Zustand 状态管理
│  └─ utils/                          # 表情映射与辅助逻辑
├─ server.ts                          # Express 服务及 AI Prompt 接口
├─ THIRD_PARTY_NOTICES.md             # 第三方资产与授权说明
└─ package.json
```

## 模型与表情资源说明

主预览区的 `public/models/facecap.glb` 是带有 52 个 Blendshape 的 FaceCap 原型模型，优点是能够被滑块、预设和时间轴实时驱动；它的造型与材质精度有限，不等同于预设卡片中的高精度人像。

如果需要实现“高精度人像外观 + 实时表情控制”，应换用具有相同或可映射 Blendshape 的正式 3D 角色资产，而不能直接用静态图片替代实时模型。

## 视频录制说明

- 导出格式为 WebM。
- 录制依赖浏览器的 `MediaRecorder` 与 Canvas 捕获能力。
- 不同浏览器对编码格式和分辨率的支持可能不同，建议优先使用最新版 Chrome 或 Edge。
- 清晰度按钮代表录制档位，最终像素尺寸还会根据预览画布比例进行适配。

## 已知限制

- 当前 FaceCap 假人是低精度原型资产，不是最终影视级角色模型。
- 高精度预设图用于传达目标情绪，不会直接随面部滑块连续变形。
- 个别复杂情绪仍需要结合多个面部参数和关键帧进行二次导演。
- WebM 的播放、编码和下载能力取决于浏览器支持。

## 第三方资产与授权

项目使用 Three.js（MIT License）。原型 FaceCap 模型来自 Three.js 官方 Morph Targets 示例，并在示例中归属于 Bannaflak 的 Face Cap。

在商业发布或再次分发之前，请将该原型模型替换为具有明确商业授权的正式角色资产，或取得模型权利人的书面许可。详细信息见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。

## 项目地址

[github.com/zhurui0523/XiaoLuo-emotion-director-studio](https://github.com/zhurui0523/XiaoLuo-emotion-director-studio)
