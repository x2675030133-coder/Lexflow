# LexFlow

LexFlow 是一个面向英语学习者的开源学习平台，集成词汇学习、阅读训练、听力练习、视频学习、发音练习、复习管理、账号同步和 AI 辅助内容生成等功能。

LexFlow is an open-source English learning platform with vocabulary study, reading practice, listening exercises, video learning, pronunciation practice, review tools, account sync, and AI-assisted content generation.

## 中文说明

### 项目功能

- 词汇学习：支持多级别词库、单词详情、例句、释义、搭配、音标和复习记录。
- 发音练习：提供发音练习页面、录音卡片、录音保存和发音进度记录。
- 阅读训练：内置双语阅读内容，支持文章阅读、阅读进度和阅读词汇增强。
- 听力练习：支持播客、语料播放、听力训练和学习进度记录。
- 视频学习：提供视频学习列表和练习入口。
- 用户系统：基于 Supabase 的注册、登录、资料管理、账号进度同步和云同步能力。
- 内容生成：提供阅读内容生成、主题词库生成、单词例句重建、单词搭配重建、阅读词汇增强和搭配校验脚本。
- 后端代理：提供 Node.js 服务用于新闻、翻译、图片、AI 内容生成和阅读库数据接口。

### 技术栈

- React
- TypeScript
- Vite
- Supabase
- Node.js
- Tailwind CSS

### 本地运行

```bash
npm install
npm run dev
```

如果需要启动后端代理服务：

```bash
npm run server:dev
```

### 常用脚本

```bash
npm run build
npm run lint
npm run generate:reading
npm run generate:topics
npm run generate:examples
npm run generate:collocations
npm run enrich:reading-vocab
npm run validate:collocations
```

### 环境变量

复制 `.env.example` 为 `.env`，然后按需填写配置：

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

注意：真实 API Key 不应该提交到 GitHub。请只提交 `.env.example`，并把真实密钥放在本地 `.env`、服务器环境变量或 GitHub Secrets 中。

### 数据与内容生成

- `npm run generate:reading`：生成双语阅读内容。
- `npm run generate:topics`：生成主题词库。
- `npm run generate:examples`：重建单词例句。
- `npm run generate:collocations`：重建单词搭配。
- `npm run enrich:reading-vocab`：增强阅读文章词汇信息。
- `npm run validate:collocations`：校验词汇搭配数据。

如果需要使用本地 ECDICT 数据，请参考：

[docs/ECDICT-IMPORT.md](docs/ECDICT-IMPORT.md)

### 安全说明

- `.env`、`.env.local`、`node_modules`、`dist`、缓存、日志文件和本地数据库文件不应提交。
- `VITE_` 开头的变量会被打包到前端代码中，不适合存放私密 API Key。
- 私密 API Key 应通过后端代理或服务器环境变量使用。
- Supabase 的 anon key 可以公开使用，但必须正确配置 Row Level Security。
- 开源版本不包含个人收款码，赞助页面使用占位内容。

## English

### Features

- Vocabulary learning: word lists, word detail pages, examples, definitions, collocations, phonetics, and review progress.
- Pronunciation practice: pronunciation page, recording card, saved recordings, and pronunciation progress tracking.
- Reading practice: bilingual articles, article reading, reading progress, and enriched reading vocabulary.
- Listening practice: podcasts, corpus playback, listening exercises, and learning progress tracking.
- Video learning: video learning pages and practice flows.
- User system: Supabase-based authentication, profile management, account progress sync, and cloud sync.
- Content generation: scripts for reading generation, topic wordlists, word examples, word collocations, reading vocabulary enrichment, and collocation validation.
- Backend proxy: Node.js service for news, translation, images, AI content generation, and reading library APIs.

### Tech Stack

- React
- TypeScript
- Vite
- Supabase
- Node.js
- Tailwind CSS

### Getting Started

```bash
npm install
npm run dev
```

To start the backend proxy server:

```bash
npm run server:dev
```

### Scripts

```bash
npm run build
npm run lint
npm run generate:reading
npm run generate:topics
npm run generate:examples
npm run generate:collocations
npm run enrich:reading-vocab
npm run validate:collocations
```

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

Do not commit real API keys to GitHub. Commit only `.env.example`, and store real secrets in your local `.env`, server environment variables, or GitHub Secrets.

### Data and Content Generation

- `npm run generate:reading`: generate bilingual reading content.
- `npm run generate:topics`: generate topic wordlists.
- `npm run generate:examples`: rebuild word examples.
- `npm run generate:collocations`: rebuild word collocations.
- `npm run enrich:reading-vocab`: enrich article vocabulary data.
- `npm run validate:collocations`: validate collocation data.

For local ECDICT data import, see:

[docs/ECDICT-IMPORT.md](docs/ECDICT-IMPORT.md)

### Security Notes

- Do not commit `.env`, `.env.local`, `node_modules`, `dist`, caches, logs, or local database files.
- Variables prefixed with `VITE_` are exposed to frontend bundles and must not contain private API keys.
- Private API keys should be used through a backend proxy or server-side environment variables.
- Supabase anon keys can be public, but Row Level Security must be configured correctly.
- The open-source version does not include personal payment QR codes. The support page uses placeholder content.

## License

No license has been selected yet. Please add a license before allowing broad reuse.
