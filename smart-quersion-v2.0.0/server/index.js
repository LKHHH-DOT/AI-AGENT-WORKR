const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// 路由
app.use("/api/questionnaires", require("./routes/questionnaires"));
app.use("/api/ai", require("./routes/ai"));

// 生产模式：托管前端静态文件
const clientDist = path.join(__dirname, "..", "client", "dist");
if (process.env.NODE_ENV === "production" && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get("/{*path}", (req, res) => {
        if (!req.path.startsWith("/api")) {
            res.sendFile(path.join(clientDist, "index.html"));
        }
    });
    console.log("前端静态文件已加载，访问 http://localhost:" + PORT);
}
const auth = require("./routes/auth");
app.use("/api/auth", auth.router);

// 导出 authMiddleware 供其他路由使用
app.set("authMiddleware", auth.authMiddleware);

// 错误处理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "服务器内部错误", error: err.message });
});

app.listen(PORT, () => {
    console.log("服务器已启动，端口: " + PORT);
});