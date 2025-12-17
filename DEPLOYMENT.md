# Mock API 部署方案

## 方案对比

### 方案 1：本地 Mock（当前方案）✅
**适用场景**：开发环境

```bash
npm run mock  # 启动 Mock API (http://localhost:4000)
npm run dev   # 启动前端 (http://localhost:5173)
```

**优点**：
- 完全控制，无需网络
- 支持文件上传和存储
- 开发调试方便

**缺点**：
- 无法在线访问
- 需要同时运行两个服务

---

### 方案 2：Vercel 部署（推荐）⭐
**适用场景**：生产环境、在线演示

#### 步骤 1：创建 API 路由
已创建文件：
- `api/upload.js` - 文件上传接口
- `api/health.js` - 健康检查接口

#### 步骤 2：配置 Vercel
已创建 `vercel.json` 配置文件

#### 步骤 3：部署到 Vercel
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署项目
vercel

# 生产部署
vercel --prod
```

#### 步骤 4：更新环境变量
部署后，更新 `.env.production` 中的 `VITE_MOCK_API_BASE` 为实际的 Vercel URL。

**优点**：
- 免费托管
- 自动 HTTPS
- 全球 CDN
- GitHub 集成自动部署

**缺点**：
- Serverless 函数有文件大小限制（4.5MB）
- 不适合大文件上传

**解决方案**：集成 Cloudinary 或 AWS S3 处理文件上传

---

### 方案 3：纯前端方案（无后端）🚀
**适用场景**：完全静态部署

#### 实现方式：使用 IndexedDB 存储音频文件

```typescript
// 创建 IndexedDB 数据库
import { openDB } from 'idb';

const db = await openDB('music-library', 1, {
  upgrade(db) {
    db.createObjectStore('songs');
    db.createObjectStore('audio-files');
  }
});

// 存储音频文件
const handleImport = async (file: File) => {
  const songId = Date.now().toString();

  // 存储文件 Blob
  await db.put('audio-files', file, songId);

  // 创建 Blob URL
  const blobUrl = URL.createObjectURL(file);

  // 存储歌曲信息
  const song = {
    id: songId,
    title: file.name,
    url: blobUrl,
    // ... 其他信息
  };

  await db.put('songs', song, songId);
};

// 读取音频文件
const loadSongs = async () => {
  const songs = await db.getAll('songs');

  // 为每首歌重新创建 Blob URL
  for (const song of songs) {
    const file = await db.get('audio-files', song.id);
    if (file) {
      song.url = URL.createObjectURL(file);
    }
  }

  return songs;
};
```

**优点**：
- 无需后端服务器
- 完全离线工作
- 数据存储在浏览器本地
- 部署简单（任何静态托管）

**缺点**：
- 数据仅存储在本地浏览器
- 无法跨设备同步
- IndexedDB 有存储限制（通常 50MB-1GB）

**实现步骤**：
1. 安装 `idb` 库：`npm install idb`
2. 修改 `App.tsx` 中的文件上传逻辑
3. 移除对 Mock API 的依赖

---

### 方案 4：真实后端服务（Supabase）☁️
**适用场景**：需要云存储和跨设备同步

#### 使用 Supabase Storage

```bash
# 安装 Supabase 客户端
npm install @supabase/supabase-js
```

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

// 上传文件
const handleImport = async (file: File) => {
  const fileName = `${Date.now()}_${file.name}`;

  const { data, error } = await supabase.storage
    .from('audio-files')
    .upload(fileName, file);

  if (error) {
    console.error('Upload error:', error);
    return;
  }

  // 获取公开 URL
  const { data: { publicUrl } } = supabase.storage
    .from('audio-files')
    .getPublicUrl(fileName);

  // 保存歌曲信息到数据库
  await supabase.from('songs').insert({
    title: file.name,
    url: publicUrl,
    // ... 其他信息
  });
};
```

**优点**：
- 真实的云存储
- 跨设备同步
- 数据库支持
- 免费额度（1GB 存储）

**缺点**：
- 需要注册 Supabase 账号
- 配置相对复杂
- 有存储限制

---

## 推荐方案总结

| 场景 | 推荐方案 | 理由 |
|------|---------|------|
| 本地开发 | 方案 1（本地 Mock） | 完全控制，调试方便 |
| 在线演示 | 方案 2（Vercel） | 免费托管，易部署 |
| 静态部署 | 方案 3（IndexedDB） | 无需后端，完全离线 |
| 生产应用 | 方案 4（Supabase） | 云存储，跨设备同步 |

---

## 快速开始

### 开发环境（方案 1）
```bash
npm run mock
npm run dev
```

### 部署到 Vercel（方案 2）
```bash
vercel --prod
```

### 纯前端方案（方案 3）
```bash
npm install idb
# 修改 App.tsx 使用 IndexedDB
npm run build
```

### Supabase 方案（方案 4）
```bash
npm install @supabase/supabase-js
# 配置 Supabase 凭证
# 修改 App.tsx 使用 Supabase API
npm run build
```

---

## 注意事项

1. **CORS 问题**：所有 API 路由已配置 CORS 头
2. **文件大小限制**：
   - Vercel Serverless: 4.5MB
   - Supabase 免费版: 1GB 总存储
   - IndexedDB: 浏览器限制（50MB-1GB）
3. **环境变量**：记得在 Vercel 控制台配置环境变量
4. **安全性**：生产环境建议添加身份验证

---

## 故障排除

### Mock API 无法连接
```bash
# 检查 Mock API 是否运行
curl http://localhost:4000/health

# 检查环境变量
echo $VITE_MOCK_API_BASE
```

### Vercel 部署失败
```bash
# 检查构建日志
vercel logs

# 本地测试构建
npm run build
npm run preview
```

### 文件上传失败
- 检查文件大小是否超过限制
- 检查 CORS 配置
- 检查网络连接

---

**最后更新**：2025-12-16
**维护者**：Apple Music Replica Team
