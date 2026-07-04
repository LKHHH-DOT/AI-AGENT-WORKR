const fs = require("fs");

// 1. 修改 server/index.js 托管静态文件
const indexPath = "server/index.js";
let index = fs.readFileSync(indexPath, "utf8");

// 在 app.use("/api/ai" 后面添加静态文件托管
index = index.replace(
  'app.use("/api/ai", require("./routes/ai"));',
  'app.use("/api/ai", require("./routes/ai"));\n\n// 生产模式：托管前端静态文件\nconst clientDist = path.join(__dirname, "..", "client", "dist");\nif (process.env.NODE_ENV === "production" && fs.existsSync(clientDist)) {\n    app.use(express.static(clientDist));\n    app.get("*", (req, res) => {\n        if (!req.path.startsWith("/api")) {\n            res.sendFile(path.join(clientDist, "index.html"));\n        }\n    });\n    console.log("前端静态文件已加载，访问 http://localhost:" + PORT);\n}'
);
// 加上 fs 引用
index = index.replace(
  'const dotenv = require("dotenv");',
  'const dotenv = require("dotenv");\nconst fs = require("fs");'
);

fs.writeFileSync(indexPath, index, "utf8");
console.log("1. Server updated for production mode");

// 2. 更新根 package.json 的脚本
const rootPkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
rootPkg.scripts = {
    "start": "node server/index.js",
    "dev": "node server/index.js & cd client && npx vite --port 3000",
    "build": "cd client && npx vite build",
    "prod": "npm run build && cross-env NODE_ENV=production node server/index.js",
    "version": "node scripts/version.js"
};
// 添加 cross-env 依赖（或者用 set 也行）
rootPkg.scripts.prod = "npm run build && set NODE_ENV=production && node server/index.js";
fs.writeFileSync("package.json", JSON.stringify(rootPkg, null, 4), "utf8");
console.log("2. Scripts updated");

// 3. 更新 start.bat
const bat = [
"@echo off",
"chcp 65001 >nul",
"title 智能问卷系统 v2.0.0",
"echo ================================",
"echo   智能问卷系统 v2.0.0",
"echo ================================",
"echo.",
"",
":: 检查是否已构建",
"if not exist client\\dist\\index.html (",
"    echo [构建] 正在打包前端...",
"    cd client",
"    call npx vite build",
"    cd ..",
"    echo [构建] 完成",
")",
"",
":: 生产模式启动",
"echo [启动] 正在启动服务...",
"set NODE_ENV=production",
"node server/index.js",
"",
"pause"
];
fs.writeFileSync("start.bat", bat.join("\n") + "\n", "utf8");
console.log("3. start.bat updated");
