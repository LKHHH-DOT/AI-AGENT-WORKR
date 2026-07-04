# 智能问卷系统 v2.0.0

AI驱动的智能问卷审核平台，防止乱填乱答。

## 功能特性

- 🤖 **AI智能审核** - 基于智谱AI，从相关性、认真度、充实度三维度评分
- 📝 **多题型支持** - 简答题、单选题、多选题、评分题
- 🔐 **用户系统** - 注册登录，JWT认证
- 🛡️ **反作弊** - 填写时长检测、同IP限制
- 🤖 **AI自动出题** - 输入主题，AI生成混合题型问卷
- 📊 **审核日志** - 每条回答的AI审核详情
- 📎 **CSV导出** - 一键导出问卷结果
- 💾 **数据持久化** - 文件存储，重启不丢失

## 快速启动

### 方式一：双击 start.bat
```
双击 start.bat 即可一键启动
```

### 方式二：手动启动
```bash
# 安装依赖
npm install
cd client && npm install && cd ..

# 配置AI（可选，编辑 server/.env）
# ZHIPU_API_KEY=你的智谱APIKey

# 启动后端（端口5000）
node server/index.js

# 新终端，启动前端（端口3000）
cd client && npx vite --port 3000
```

## 访问

- 前端: http://localhost:3000
- 后端API: http://localhost:5000

## 版本管理
```bash
# 查看版本
node scripts/version.js

# 更新版本号
node scripts/version.js patch  # 2.0.0 -> 2.0.1
node scripts/version.js minor  # 2.0.0 -> 2.1.0
node scripts/version.js major  # 2.0.0 -> 3.0.0
```

## 技术栈

- 前端: React 18 + Vite
- 后端: Node.js + Express
- AI: 智谱AI (GLM-4-Flash)
- 存储: JSON文件

## 项目结构

```
smart-quersion/
├── server/          # 后端
│   ├── index.js     # 入口
│   ├── routes/      # API路由
│   ├── models/      # 数据模型
│   └── data/        # 数据文件（自动生成）
├── client/          # 前端
│   └── src/         # 源码
├── scripts/         # 工具脚本
├── start.bat        # 一键启动脚本
└── README.md
```