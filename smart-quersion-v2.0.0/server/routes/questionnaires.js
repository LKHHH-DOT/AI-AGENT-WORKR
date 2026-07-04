const express = require("express");
const router = express.Router();
const Questionnaire = require("../models/Questionnaire");

// 获取auth中间件
function getAuthMiddleware(req, res, next) {
    const auth = req.app && req.app.get ? req.app.get("authMiddleware") : null;
    if (auth) return auth(req, res, next);
    req.userId = null;
    next();
}

// 创建问卷
router.post("/", async (req, res) => {
    try {
        const { title, description, questions, aiMode } = req.body;
        if (!title || !questions || questions.length === 0) {
            return res.status(400).json({ message: "请提供问卷标题和题目" });
        }
        const q = await Questionnaire.create({
            title,
            description: description || "",
            type: "questionnaire",
            creatorId: req.headers["x-user-id"] || null,
            aiMode: aiMode || "strict",
            questions: questions.map((q, i) => ({
                id: q.id || "q_" + i + "_" + Date.now(),
                type: q.type || "text",
                title: q.title,
                options: q.options || [],
                required: q.required !== undefined ? q.required : true,
                aiCheck: q.aiCheck !== undefined ? q.aiCheck : true,
                maxLength: q.maxLength || 2000
            })),
            responses: [],
            createdAt: new Date().toISOString()
        });
        res.status(201).json({ message: "问卷创建成功", questionnaire: q });
    } catch (err) {
        res.status(500).json({ message: "创建失败", error: err.message });
    }
});

// 获取所有问卷
router.get("/", async (req, res) => {
    try {
        const list = await Questionnaire.find();
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: "获取失败", error: err.message });
    }
});

// 获取用户的问卷
router.get("/my/:userId", async (req, res) => {
    try {
        const all = await Questionnaire.find();
        const mine = all.filter(q => q.creatorId === req.params.userId);
        res.json(mine);
    } catch (err) {
        res.status(500).json({ message: "获取失败", error: err.message });
    }
});

// 获取单个问卷
router.get("/:id", async (req, res) => {
    try {
        const q = await Questionnaire.findById(req.params.id);
        if (!q) return res.status(404).json({ message: "问卷不存在" });
        res.json(q);
    } catch (err) {
        res.status(500).json({ message: "获取失败", error: err.message });
    }
});

// 删除问卷
router.delete("/:id", async (req, res) => {
    try {
        const ok = await Questionnaire.deleteById(req.params.id);
        if (!ok) return res.status(404).json({ message: "问卷不存在" });
        res.json({ message: "删除成功" });
    } catch (err) {
        res.status(500).json({ message: "删除失败", error: err.message });
    }
});

// 提交回答（含反作弊检测）
router.post("/:id/submit", async (req, res) => {
    try {
        const q = await Questionnaire.findById(req.params.id);
        if (!q) return res.status(404).json({ message: "问卷不存在" });
        const { respondentName, answers, fillTime } = req.body;

        // 反作弊：填写时间检测
        if (fillTime !== undefined && fillTime < 10) {
            return res.status(400).json({
                message: "填写时间过短（少于10秒），请认真填写后再提交",
                antiCheat: true
            });
        }

        // 反作弊：同IP限制（同一问卷同IP最多提交3次）
        const clientIp = req.headers["x-forwarded-for"] || req.ip || "";
        const ipCount = q.responses.filter(r => r.ip === clientIp).length;
        if (ipCount >= 3) {
            return res.status(400).json({
                message: "同一IP提交次数过多（上限3次）",
                antiCheat: true
            });
        }

        const allPassed = answers.every(a => a.aiPassed !== false);
        if (!allPassed) {
            return res.status(400).json({
                message: "部分回答未通过AI审核，请修改后重新提交",
                failedAnswers: answers.filter(a => a.aiPassed === false)
            });
        }

        const response = {
            _id: "r_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
            respondentName: respondentName || "匿名",
            answers,
            fillTime: fillTime || 0,
            ip: clientIp,
            submittedAt: new Date().toISOString(),
            allPassed: true
        };
        q.responses.push(response);
        await Questionnaire.findByIdAndUpdate(req.params.id, { responses: q.responses });
        res.json({ message: "提交成功", responseId: response._id });
    } catch (err) {
        res.status(500).json({ message: "提交失败", error: err.message });
    }
});

// 获取结果
router.get("/:id/results", async (req, res) => {
    try {
        const q = await Questionnaire.findById(req.params.id);
        if (!q) return res.status(404).json({ message: "问卷不存在" });
        // 统计分析
        const stats = {};
        q.questions.forEach(qq => {
            const answers = q.responses.map(r => r.answers.find(a => a.questionId === qq.id)).filter(Boolean);
            const wordCounts = answers.map(a => (a.answer || "").length);
            const avgScore = answers.reduce((s, a) => s + (a.aiScore || 0), 0) / (answers.length || 1);
            stats[qq.id] = {
                totalAnswers: answers.length,
                avgLength: wordCounts.reduce((s, c) => s + c, 0) / (wordCounts.length || 1),
                avgAiScore: Math.round(avgScore * 10) / 10,
            };
        });
        res.json({
            title: q.title,
            description: q.description,
            aiMode: q.aiMode,
            totalResponses: q.responses.length,
            questions: q.questions,
            responses: q.responses,
            stats
        });
    } catch (err) {
        res.status(500).json({ message: "获取失败", error: err.message });
    }
});

// 导出CSV
router.get("/:id/export/csv", async (req, res) => {
    try {
        const q = await Questionnaire.findById(req.params.id);
        if (!q) return res.status(404).json({ message: "问卷不存在" });
        const header = ["序号", "填写人", "提交时间", ...q.questions.map((_, i) => "Q" + (i+1))];
        const rows = q.responses.map((r, idx) => {
            const row = [idx + 1, r.respondentName, r.submittedAt];
            q.questions.forEach(qq => {
                const ans = r.answers.find(a => a.questionId === qq.id);
                row.push(ans ? ans.answer.replace(/,/g, "，") : "");
            });
            return row.join(",");
        });
        const csv = "\uFEFF" + header.join(",") + "\n" + rows.join("\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", "attachment; filename=" + encodeURIComponent(q.title) + ".csv");
        res.send(csv);
    } catch (err) {
        res.status(500).json({ message: "导出失败", error: err.message });
    }
});


// ========== AI 生成题目 ==========
router.post("/ai-generate-questions", async (req, res) => {
    try {
        const { topic, count } = req.body;
        if (!topic) return res.status(400).json({ message: "请提供主题" });
        const n = Math.min(Math.max(parseInt(count) || 5, 3), 15);

        // 尝试调用AI生成
        const config = loadAIConfig();
        if (config.apiKey && !config.apiKey.includes("your_")) {
            const OpenAI = require("openai");
            const openai = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
            const prompt = "你是一个专业的问卷设计师。请根据主题\"" + topic + "\"生成" + n + "道高质量的问卷题目。要求：\n1. 题目类型多样化（简答题、选择题、评分题混合）\n2. 题目应该有深度，能引导用户认真回答\n3. 选择题需要提供4个选项\n4. 输出JSON数组格式\n\n输出格式：\n[\n  {\"type\": \"text\", \"title\": \"题目内容\", \"required\": true, \"aiCheck\": true},\n  {\"type\": \"choice\", \"title\": \"题目内容\", \"required\": true, \"aiCheck\": true, \"options\": [\"选项1\", \"选项2\", \"选项3\", \"选项4\"]},\n  {\"type\": \"rating\", \"title\": \"题目内容\", \"required\": true, \"aiCheck\": false}\n]\n只输出JSON数组，不要其他文字。";
            const response = await openai.chat.completions.create({ model: config.model, messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: 2000 });
            const content2 = response.choices[0].message.content;
            const jsonMatch = content2.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const questions = JSON.parse(jsonMatch[0]);
                return res.json({ success: true, questions });
            }
        }

        // 本地fallback：根据主题生成模板题目
        const templates = getLocalQuestions(topic, n);
        res.json({ success: true, questions: templates });
    } catch (err) {
        res.status(500).json({ message: "生成失败", error: err.message });
    }
});

function loadAIConfig() {
    const path = require("path");
    const fs2 = require("fs");
    const envPath2 = path.join(__dirname, "..", ".env");
    let provider = "zhipu", apiKey = "", baseURL = "https://open.bigmodel.cn/api/paas/v4", model = "glm-4-flash";
    try {
        if (fs2.existsSync(envPath2)) {
            const c = fs2.readFileSync(envPath2, "utf8");
            const pm = c.match(/^AI_PROVIDER=(.+)$/m);
            if (pm) provider = pm[1].trim().toLowerCase();
            if (provider === "zhipu") {
                const k = c.match(/^ZHIPU_API_KEY=(.+)$/m);
                if (k) apiKey = k[1].trim();
                const m = c.match(/^ZHIPU_MODEL=(.+)$/m);
                if (m) model = m[1].trim();
            } else if (provider === "deepseek") {
                const k = c.match(/^DEEPSEEK_API_KEY=(.+)$/m); if (k) apiKey = k[1].trim();
                const m = c.match(/^DEEPSEEK_MODEL=(.+)$/m); if (m) model = m[1].trim();
                baseURL = "https://api.deepseek.com/v1";
            } else {
                const k = c.match(/^OPENAI_API_KEY=(.+)$/m); if (k) apiKey = k[1].trim();
                const u = c.match(/^OPENAI_BASE_URL=(.+)$/m); if (u) baseURL = u[1].trim();
                const m = c.match(/^OPENAI_MODEL=(.+)$/m); if (m) model = m[1].trim();
            }
        }
    } catch (e) {}
    return { apiKey, baseURL, model };
}

function getLocalQuestions(topic, n) {
    const questions = [];
    const types = ["text", "text", "choice", "text", "choice", "rating", "text", "choice", "text"];
    const questionStarters = [
        "关于" + topic + "，你有什么想分享的？",
        "你平时怎么看待" + topic + "？",
        "你觉得" + topic + "对你来说重要吗？为什么？",
        "如果可以改变" + topic + "的现状，你会怎么做？",
        "描述一次与" + topic + "相关的难忘经历",
        "你身边的人对" + topic + "持什么态度？",
        "未来你希望在" + topic + "方面达成什么目标？",
        "如果用三个词形容" + topic + "，你会选什么？",
        "请给" + topic + "的现状打分（1-10分）",
    ];
    for (let i = 0; i < n; i++) {
        const type = types[i % types.length];
        const title = questionStarters[i % questionStarters.length];
        const q = { id: "ai_q_" + i + "_" + Date.now(), type, title, required: true, aiCheck: type !== "rating" };
        if (type === "choice") {
            q.options = ["非常认同", "比较认同", "一般", "不太认同", "完全不认同"];
        }
        questions.push(q);
    }
    return questions;
}

module.exports = router;