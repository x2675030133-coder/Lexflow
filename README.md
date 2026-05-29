# LexFlow

LexFlow 是一个面向英语学习者的开源学习平台，围绕背单词、听力口语、双语阅读、音标发音、学习统计、账号同步和内容生成工作流构建。

LexFlow is an open-source English learning platform focused on vocabulary study, listening and speaking practice, bilingual reading, pronunciation training, learning analytics, account sync, and content-generation workflows.

## 中文说明

### 最近更新

- 新增例句校验脚本 `validate:examples`，用于检查词库例句质量。
- 新增词汇用法说明数据，单词学习内容更丰富。
- 新增学习时长追踪工具，用于统计学习活动时长。
- 增强阅读学习进度记录，支持更细的文章学习状态。
- 增强账号进度同步逻辑，并补充 Supabase 账号进度 SQL 文档。
- 增强个人资料、安全设置、导航栏、页脚和学习统计相关页面。
- 新增公安备案图标资源 `public/beian/gongan.png`。
- 更新 junior、senior 等部分词库数据。

### 核心功能

- 背单词：支持多级别词库、主题词库、单词详情、释义、例句、搭配、用法说明、音标、收藏和复习记录。
- 学习与复习：提供学习页、复习页、词书页和单词详情页，记录学习状态、复习时间、掌握情况和学习时长。
- 听力口语：支持听力材料列表、语料练习、播客列表和单集播客练习。
- 音标发音：提供音标发音页面、发音示例、录音练习、录音反馈、收藏和练习进度记录。
- 双语阅读：提供文章列表、文章阅读页、阅读进度、文章学习状态、阅读词汇信息和阅读库刷新能力。
- 学习统计：展示词汇、听力、阅读、播客、发音、学习时长等进度概览。
- 学习工具：集中放置辅助学习入口和工具页。
- 账号系统：基于 Supabase 实现注册、登录、个人资料、头像/昵称资料、偏好设置、安全设置和云同步。
- 进度同步：支持按账号隔离本地学习数据，并将词汇、听力、阅读、播客和发音进度同步到账号。
- 帮助与合规页面：包含帮助中心、新手指南、账号管理说明、FAQ、隐私政策、使用条款、备案图标和赞助页面。
- 内容生成：提供阅读内容、主题词库、单词例句、单词搭配、阅读词汇增强、例句校验和搭配校验脚本。
- 后端代理：提供 Node.js 服务，用于阅读库、新闻源、翻译、图片、AI 内容生成和播客/阅读数据接口。

### 当前没有的功能

- 本项目当前版本不包含视频学习模块。
- 开源版本不包含个人收款码，赞助页使用占位内容。

### 技术栈

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Node.js

### 本地运行

```bash
npm install
npm run dev
```

启动后端代理服务：

```bash
npm run server:dev
```

构建生产版本：

```bash
npm run build
```

### 常用脚本

```bash
npm run lint
npm run generate:reading
npm run generate:topics
npm run generate:examples
npm run generate:collocations
npm run validate:examples
npm run enrich:reading-vocab
npm run validate:collocations
```

脚本用途：

- `generate:reading`：生成或刷新双语阅读内容。
- `generate:topics`：生成主题词库。
- `generate:examples`：重建单词例句。
- `generate:collocations`：重建单词搭配。
- `validate:examples`：校验单词例句数据。
- `enrich:reading-vocab`：补充阅读文章中的重点词汇信息。
- `validate:collocations`：校验单词搭配数据。

### 环境变量

复制 `.env.example` 为 `.env`，然后按需填写：

```bash
cp .env.example .env
```

常用变量包括：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `DEEPSEEK_API_KEY`
- `GUARDIAN_API_KEY`
- `NEWSAPI_KEY`
- `DEEPL_API_KEY`
- `PEXELS_API_KEY`

真实 API Key 不应该提交到 GitHub。请只提交 `.env.example`，并把真实密钥放在本地 `.env`、服务器环境变量、部署平台环境变量或 GitHub Secrets 中。

### 数据说明

- `public/data` 存放前端可直接读取的词库和阅读数据。
- `public/beian` 存放公开备案图标资源。
- `server/data` 存放后端阅读库快照数据。
- `scripts/data` 存放生成脚本使用的缓存数据。
- `docs/SUPABASE-ACCOUNT-PROGRESS.sql` 提供账号进度同步相关 SQL。
- 大型本地词典数据库、构建产物、日志和压缩包不应提交到仓库。

如果需要使用本地 ECDICT 数据，请参考：

[docs/ECDICT-IMPORT.md](docs/ECDICT-IMPORT.md)

### 安全说明

- 不要提交 `.env`、`.env.local`、`node_modules`、`dist`、`.cache`、日志文件、构建缓存和本地数据库文件。
- `VITE_` 开头的变量会被打包进前端代码，不适合存放私密 API Key。
- 私密 API Key 应通过后端代理或服务器端环境变量使用。
- Supabase anon key 可以公开使用，但必须正确配置 Row Level Security。
- 开源版本中的帮助邮箱和赞助信息均为占位内容，请在部署自己的版本时替换。

## English

### Recent Updates

- Added `validate:examples` for checking word example quality.
- Added word usage notes to enrich vocabulary learning content.
- Added study time tracking utilities.
- Improved reading study progress records for article-level learning status.
- Improved account progress sync and added Supabase SQL documentation for account progress.
- Improved profile, security settings, navigation, footer, and dashboard-related pages.
- Added public security filing icon asset at `public/beian/gongan.png`.
- Updated parts of the junior and senior wordlist data.

### Core Features

- Vocabulary study: multi-level word lists, topic word lists, word detail pages, definitions, examples, collocations, usage notes, phonetics, favorites, and review records.
- Learning and review: learning page, review page, wordbook, and word detail flows with progress, review scheduling, mastery records, and study time tracking.
- Listening and speaking: listening material list, corpus practice, podcast list, and episode-level podcast practice.
- Pronunciation training: phonetics page, pronunciation examples, recording practice, recording feedback, favorites, and practice progress.
- Bilingual reading: article list, article reading page, reading progress, article study status, article vocabulary data, and reading library refresh support.
- Learning analytics: dashboard for vocabulary, listening, reading, podcast, pronunciation, and study time progress.
- Learning tools: a dedicated tools page for study utilities and entry points.
- Account system: Supabase-based registration, login, profile, avatar/nickname profile data, preferences, security settings, and cloud sync.
- Progress sync: account-scoped local data and sync for vocabulary, listening, reading, podcast, and pronunciation progress.
- Help and policy pages: help center, beginner guide, account management guide, FAQ, privacy policy, terms, public filing icon, and support page.
- Content generation: scripts for reading content, topic wordlists, word examples, word collocations, reading vocabulary enrichment, example validation, and collocation validation.
- Backend proxy: Node.js service for reading libraries, news sources, translation, images, AI content generation, and podcast/reading APIs.

### Not Included

- This version does not include a video learning module.
- The open-source version does not include personal payment QR codes. The support page uses placeholder content.

### Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Node.js

### Getting Started

```bash
npm install
npm run dev
```

Start the backend proxy server:

```bash
npm run server:dev
```

Build for production:

```bash
npm run build
```

### Scripts

```bash
npm run lint
npm run generate:reading
npm run generate:topics
npm run generate:examples
npm run generate:collocations
npm run validate:examples
npm run enrich:reading-vocab
npm run validate:collocations
```

Script purposes:

- `generate:reading`: generate or refresh bilingual reading content.
- `generate:topics`: generate topic wordlists.
- `generate:examples`: rebuild word examples.
- `generate:collocations`: rebuild word collocations.
- `validate:examples`: validate word example data.
- `enrich:reading-vocab`: enrich key vocabulary for reading articles.
- `validate:collocations`: validate collocation data.

### Environment Variables

Copy `.env.example` to `.env` and fill in the values you need:

```bash
cp .env.example .env
```

Common variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `DEEPSEEK_API_KEY`
- `GUARDIAN_API_KEY`
- `NEWSAPI_KEY`
- `DEEPL_API_KEY`
- `PEXELS_API_KEY`

Do not commit real API keys to GitHub. Commit only `.env.example`, and store real secrets in your local `.env`, server environment variables, deployment platform environment variables, or GitHub Secrets.

### Data Notes

- `public/data` contains frontend-readable vocabulary and reading data.
- `public/beian` contains public filing icon assets.
- `server/data` contains backend reading library snapshots.
- `scripts/data` contains cache data used by generation scripts.
- `docs/SUPABASE-ACCOUNT-PROGRESS.sql` provides SQL for account progress sync.
- Large local dictionary databases, build outputs, logs, and archives should not be committed.

For local ECDICT data import, see:

[docs/ECDICT-IMPORT.md](docs/ECDICT-IMPORT.md)

### Security Notes

- Do not commit `.env`, `.env.local`, `node_modules`, `dist`, `.cache`, logs, build caches, or local database files.
- Variables prefixed with `VITE_` are exposed to frontend bundles and must not contain private API keys.
- Private API keys should be used through a backend proxy or server-side environment variables.
- Supabase anon keys can be public, but Row Level Security must be configured correctly.
- The help email and support information in the open-source version are placeholders. Replace them when deploying your own version.

## License

No license has been selected yet. Please add a license before allowing broad reuse.
