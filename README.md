# LexFlow

LexFlow 是一个面向英语学习者的开源学习平台，集成词汇学习、阅读训练、听力练习、视频学习、复习管理和 AI 辅助内容生成等功能。

LexFlow is an open-source English learning platform with vocabulary study, reading practice, listening exercises, video learning, review tools, and AI-assisted content generation.

## 中文说明

### 项目功能

- 词汇学习：支持多级别词库、单词详情、例句、释义和复习记录。
- 阅读训练：内置双语阅读内容，并支持自动生成阅读素材。
- 听力练习：支持播客、语料播放和听力训练页面。
- 视频学习：提供视频学习列表和练习入口。
- 用户系统：基于 Supabase 的注册、登录、资料和云同步能力。
- 内容生成：提供脚本和 GitHub Actions 工作流，用于生成阅读内容和主题词库。

### 技术栈

- React
- TypeScript
- Vite
- Supabase
- Node.js

### 本地运行

```bash
npm install
npm run dev
```

如果需要启动后端代理服务：

```bash
npm run server:dev
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

### 生成阅读内容

```bash
npm run generate:reading
```

需要在 `.env` 中配置相关 AI 和新闻源密钥。

### 生成主题词库

```bash
npm run generate:topics
```

如果需要使用本地 ECDICT 数据，请参考：

[docs/ECDICT-IMPORT.md](docs/ECDICT-IMPORT.md)

### 安全说明

- `.env`、`.env.local`、`node_modules`、`dist`、日志文件和本地数据库文件不应提交。
- `VITE_` 开头的变量会被打包到前端代码中，不适合存放私密 API Key。
- 私密 API Key 应通过后端代理或服务器环境变量使用。
- Supabase 的 anon key 可以公开使用，但必须正确配置 Row Level Security。

## English

### Features

- Vocabulary learning: word lists, word detail pages, examples, definitions, and review progress.
- Reading practice: built-in bilingual reading content and generated reading materials.
- Listening practice: podcast listening, corpus playback, and listening exercises.
- Video learning: video learning pages and practice flows.
- User system: Supabase-based authentication, profile management, and cloud sync.
- Content generation: scripts and GitHub Actions workflow for reading content and topic wordlists.

### Tech Stack

- React
- TypeScript
- Vite
- Supabase
- Node.js

### Getting Started

```bash
npm install
npm run dev
```

To start the backend proxy server:

```bash
npm run server:dev
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

### Generate Reading Content

```bash
npm run generate:reading
```

This requires AI and news source credentials in `.env`.

### Generate Topic Wordlists

```bash
npm run generate:topics
```

For local ECDICT data import, see:

[docs/ECDICT-IMPORT.md](docs/ECDICT-IMPORT.md)

### Security Notes

- Do not commit `.env`, `.env.local`, `node_modules`, `dist`, logs, or local database files.
- Variables prefixed with `VITE_` are exposed to frontend bundles and must not contain private API keys.
- Private API keys should be used through a backend proxy or server-side environment variables.
- Supabase anon keys can be public, but Row Level Security must be configured correctly.

## License

No license has been selected yet. Please add a license before allowing broad reuse.
