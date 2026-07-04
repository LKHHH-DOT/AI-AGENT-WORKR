const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "smart-questionnaire-secret-key-2024";

// 注册
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "请提供用户名、邮箱和密码" });
        }
        const existing = await User.findByEmail(email);
        if (existing) {
            return res.status(400).json({ message: "该邮箱已被注册" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            questionnaires: []
        });
        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({
            message: "注册成功",
            token,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (err) {
        res.status(500).json({ message: "注册失败", error: err.message });
    }
});

// 登录
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "请提供邮箱和密码" });
        }
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ message: "邮箱或密码错误" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "邮箱或密码错误" });
        }
        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
        res.json({
            message: "登录成功",
            token,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (err) {
        res.status(500).json({ message: "登录失败", error: err.message });
    }
});

// 验证Token中间件
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "未登录" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        req.userEmail = decoded.email;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Token无效或已过期" });
    }
}

// 获取当前用户信息
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "用户不存在" });
        res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            questionnaires: user.questionnaires || []
        });
    } catch (err) {
        res.status(500).json({ message: "获取失败", error: err.message });
    }
});

module.exports = { router, authMiddleware };