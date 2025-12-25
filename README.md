# Flower Daily - 每日花语系统部署文档

**Flower Daily** 是一个基于 **Next.js** 全栈开发的内容管理系统，专注于花卉及其花语的展示与管理。系统集成了 AI（DeepSeek/OpenAI）自动生成内容功能以及 Unsplash 图片搜索功能。

## 🛠 技术栈

* **框架**: [Next.js 14+](https://nextjs.org/) (App Router)
* **语言**: TypeScript
* **数据库 ORM**: [Prisma](https://www.prisma.io/)
* **数据库**: SQLite (默认) / 可切换 PostgreSQL 或 MySQL
* **样式**: Tailwind CSS
* **UI 组件**: Lucide React
* **外部服务**:
* Unsplash API (图片搜索)
* OpenAI 兼容接口 (DeepSeek 等 AI 内容生成)



---

## 📋 环境准备

在开始部署之前，请确保您的环境满足以下要求：

* **Node.js**: v18.17.0 或更高版本
* **包管理器**: npm, yarn, 或 pnpm
* **数据库**:
* 本地开发默认为 SQLite（无需额外安装）。
* 生产环境建议使用 PostgreSQL 或 MySQL（需修改 Prisma 配置）。



---

## 🚀 本地开发与安装

### 1. 克隆项目

```bash
git clone <repository-url>
cd flower-daily

```

### 2. 安装依赖

```bash
npm install
# 或者
yarn install
# 或者
pnpm install

```

### 3. 配置环境变量

在项目根目录创建一个 `.env` 文件。您可以复制 `.env.example`（如果存在），或者直接创建：

```env
# .env

# 数据库连接地址
# 如果使用 SQLite (默认):
DATABASE_URL="file:./dev.db"

# 如果使用 PostgreSQL:
# DATABASE_URL="postgresql://user:password@localhost:5432/flower_daily?schema=public"

# 如果代码中有使用到加密相关的密钥 (参考 lib/crypto.ts)
# 建议设置一个强随机字符串
NEXT_PUBLIC_APP_URL="http://localhost:3000"

```

### 4. 数据库迁移

使用 Prisma 初始化数据库表结构：

```bash
# 生成 Prisma Client
npx prisma generate

# 推送数据库结构 (开发环境)
npx prisma migrate dev --name init

```

### 5. 创建初始管理员账户

由于系统有登录鉴权（`app/login`），您需要手动在数据库中创建一个初始用户，或者使用 Prisma Studio 进行操作：

```bash
npx prisma studio

```

1. 在浏览器打开 Prisma Studio。
2. 选择 `User` 模型。
3. 添加一条记录：
* `username`: admin (或您喜欢的用户名)
* `password`: (注意：生产环境应存储哈希后的密码，但在开发初期如果 auth 逻辑较简单，请确认 `app/actions/auth.ts` 中的密码比对逻辑。如果是明文存储或简单加密，请直接填入；如果是 bcrypt，请填入哈希值)。
* `roleId`: (需先创建 Role 表数据，如 `code: admin`)



### 6. 启动开发服务器

```bash
npm run dev

```

访问 [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) 查看应用。

---

## 📦 生产环境部署

### 方式一：Vercel 部署 (推荐)

由于本项目使用 Next.js，部署到 Vercel 是最简单的选择。

1. **代码推送**: 将代码推送到 GitHub/GitLab。
2. **导入项目**: 在 Vercel 面板导入该仓库。
3. **环境变量**: 在 Vercel 设置中添加 `DATABASE_URL`。
* *注意*: Vercel Serverless 环境不支持本地 SQLite 文件的持久化。如果您部署到 Vercel，**强烈建议将数据库切换为 PostgreSQL (如 Vercel Postgres, Supabase, Neon)**。


4. **构建命令**: Vercel 会自动识别，通常为 `npm run build`。
5. **部署**: 点击 Deploy。

### 方式二：Docker / VPS 自托管

如果您希望部署在自己的服务器上（使用 SQLite 或其他数据库）：

1. **构建项目**:
```bash
npm run build

```


2. **启动服务**:
```bash
npm start

```


建议使用 `pm2` 来守护进程：
```bash
pm2 start npm --name "flower-daily" -- start

```



---

## ⚙️ 系统配置 (后台管理)

系统启动并登录后台后，请务必完成以下配置以启用完整功能：

访问路径：`/admin/settings` (假设路由)

### 1. 图片服务配置 (Image Config)

为使用 Unsplash 图片搜索功能：

* **服务商**: Unsplash
* **Access Key**: 填入您的 Unsplash Access Key
* **Secret Key**: 填入您的 Unsplash Secret Key
* **激活状态**: 开启

### 2. AI 服务配置 (App/System Config)

为使用 AI 自动生成花语和信息：

* **Base URL**: 例如 `https://api.deepseek.com/v1` (或 OpenAI 地址)
* **API Key**: 填入您的 API Key
* **模型名称**: 例如 `deepseek-chat` 或 `gpt-3.5-turbo`
* **激活状态**: 开启

---

## 📂 核心目录结构说明

```
flower-daily/
├── app/                 # Next.js App Router 页面与路由
│   ├── actions/         # Server Actions (后端逻辑)
│   ├── admin/           # 后台管理页面
│   ├── api/             # API 路由
│   └── ...
├── components/          # React 组件
│   ├── FlowerForm.tsx   # 花卉录入表单
│   ├── BatchImport...   # 批量导入组件
│   └── ...
├── lib/                 # 工具库
│   ├── prisma.ts        # 数据库实例
│   ├── crypto.ts        # 加密工具
│   └── utils.ts         # 通用工具
├── public/              # 静态资源
└── prisma/              # 数据库 Schema 与迁移文件

```

## ⚠️ 注意事项

1. **数据库类型**: `prisma/schema.prisma` 默认配置为 `sqlite`。若要切换数据库，请修改 `provider` 并更新 `.env` 中的 `DATABASE_URL` 格式。
2. **安全性**: `lib/crypto.ts` 用于加密存储敏感配置（如 API Key）。请确保生产环境密钥安全。
3. **图片链接**: 系统目前存储的是图片 URL (主要来自 Unsplash)。如果使用 `BatchImport` 导入 Excel，请确保 Excel 模板格式正确。