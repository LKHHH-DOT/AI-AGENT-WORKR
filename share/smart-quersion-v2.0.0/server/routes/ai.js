const express = require("express");
const router = express.Router();
const path2 = require("path");
const fs2 = require("fs");

// ========== 读取配置 ==========
const envPath = path2.join(__dirname, "..", ".env");
function readConfig() {
    let provider = "zhipu";
    let apiKey = "";
    let baseURL = "https://open.bigmodel.cn/api/paas/v4";
    let model = "glm-4-flash";
    try {
        if (fs2.existsSync(envPath)) {
            const c = fs2.readFileSync(envPath, "utf8");
            const pm = c.match(/^AI_PROVIDER=(.+)$/m);
            if (pm) provider = pm[1].trim().toLowerCase();
            if (provider === "zhipu") {
                const k = c.match(/^ZHIPU_API_KEY=(.+)$/m);
                if (k) apiKey = k[1].trim();
                const m = c.match(/^ZHIPU_MODEL=(.+)$/m);
                if (m) model = m[1].trim();
                baseURL = "https://open.bigmodel.cn/api/paas/v4";
            } else if (provider === "deepseek") {
                const k = c.match(/^DEEPSEEK_API_KEY=(.+)$/m);
                if (k) apiKey = k[1].trim();
                const m = c.match(/^DEEPSEEK_MODEL=(.+)$/m);
                if (m) model = m[1].trim();
                baseURL = "https://api.deepseek.com/v1";
            } else {
                const k = c.match(/^OPENAI_API_KEY=(.+)$/m);
                if (k) apiKey = k[1].trim();
                const u = c.match(/^OPENAI_BASE_URL=(.+)$/m);
                if (u) baseURL = u[1].trim();
                const m = c.match(/^OPENAI_MODEL=(.+)$/m);
                if (m) model = m[1].trim();
            }
        }
    } catch (e) {}
    return { provider, apiKey, baseURL, model };
}

// ========== AI 审核核心（细粒度评分版） ==========
async function aiCheckAnswer(question, answer) {
    const config = readConfig();
    if (!config.apiKey || config.apiKey.includes("your_")) {
        return localCheck(question, answer);
    }
    try {
        const OpenAI = require("openai");
        const openai = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
        const prompt = "你是一个严谨的问卷审核员。请判断用户的回答是否与题目相关且认真填写。注意：如果回答质量好、真诚、有内容，请在praise字段给一句温暖、鼓励的表扬。如果回答中有明显的错别字（例如'老是'->'老师'、'梦相'->'梦想'），请在reason中指出具体错别字并给出正确写法。但错别字本身不应直接导致不通过，除非内容完全无法理解。\n\n题目：" + question + "\n回答：" + answer + "\n\n请从以下维度评分（1-10分），并输出JSON格式：\n1. 相关性(relevance)：回答与题目的相关程度\n2. 认真度(seriousness)：是否认真填写，不是胡乱回答\n3. 充实度(substance)：是否有实质内容\n\n规则：\n- 总分 < 15 或 任一维度 < 4 视为不通过(passed: false)\n- 给出具体的中文原因和建议\n\n输出格式：\n{\"passed\": true/false,\"score\": 总分,\"dimensions\": {\"relevance\": 分数,\"seriousness\": 分数,\"substance\": 分数},\"reason\": \"原因说明（中文）\",\"suggestion\": \"改进建议（中文）\"}";
        const response = await openai.chat.completions.create({
            model: config.model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 600
        });
        
        const content = response.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            // 确保score是三个维度之和
            const dims = parsed.dimensions || {};
            const correctScore = (dims.relevance || 0) + (dims.seriousness || 0) + (dims.substance || 0);
            parsed.score = correctScore || parsed.score || 0;
            // 确保passed判断正确
            const minDim = Math.min(dims.relevance || 10, dims.seriousness || 10, dims.substance || 10);
            if (parsed.passed === undefined) {
                parsed.passed = correctScore >= 15 && minDim >= 4;
            }
            // 通过的回答自动加表扬
            if (parsed.passed && !parsed.praise) {
                const list = [
                    "说得好，为你点赞！",
                    "很真诚的回答，加油！",
                    "说得对，坚持就是胜利！",
                    "有想法的回答，真棒！",
                    "说得太好了，充满正能量！",
                    "这个回答让人感动，加油！",
                    "真诚是最可贵的，说得好！",
                    "继续努力，你一定可以的！",
                ];
                parsed.praise = list[Math.floor(Math.random() * list.length)];
            }
            return parsed;
        }
        return { passed: true, score: 30, dimensions: { relevance: 10, seriousness: 10, substance: 10 }, reason: "审核通过", suggestion: "" };

    } catch (err) {
        console.error("AI审核错误:", err.message);
        return localCheck(question, answer);
    }
}

// ========== 本地审核（带评分） ==========
function localCheck(question, answer) {
    if (!answer || answer.trim().length === 0) {
        return { passed: false, score: 0, dimensions: { relevance: 0, seriousness: 0, substance: 0 }, reason: "回答不能为空", suggestion: "请认真填写回答" };
    }
    const a = answer.trim();
    let relevance = 10, seriousness = 10, substance = 10;
    const reasons = [];

    // 敷衍检测
    const trash = [/^[.\-_\s]+$/, /^(好|是|嗯|哦|啊|对|不|没|有|行|可以|不知道|没有想法|无|随便|都行|没什么|还行|不好|不行|一般|就这样)$/i, /^(111|222|aaa|bbb|test|测试|哈哈|呵呵|嘻嘻)$/i, /^(asdf|qwer|zxcv)$/i, /^[0-9]{4,}$/, /^[a-z]{5,}$/i];
    for (const p of trash) {
        if (p.test(a)) {
            seriousness = 1; substance = 1;
            reasons.push("回答内容过于敷衍");
            break;
        }
    }

    // 太短
    if (a.length <= 2) {
        seriousness = Math.min(seriousness, 2);
        substance = Math.min(substance, 2);
        reasons.push("回答太简短");
    }

    // 常识规则
    const rules = [
        { q: /梦想|理想|愿望|目标|抱负|志向|追求|未来/, a: /吃|喝|零食|饭菜/, r: "与梦想/理想主题无关" },
        { q: /运动|体育|锻炼|健身|跑步/, a: /吃|喝|零食|火锅|饭菜/, r: "与运动主题无关" },
        { q: /学习|读书|考试|教育/, a: /吃|喝|游戏|玩/, r: "与学习主题无关" },
        { q: /工作|职业|事业|就业/, a: /吃|喝|玩|游戏/, r: "与工作主题无关" },
    ];
    for (const r of rules) {
        if (r.q.test(question) && r.a.test(a) && a.length < 20) {
            relevance = 2;
            reasons.push(r.r);
            break;
        }
    }

    const totalScore = relevance + seriousness + substance;
    const passed = totalScore >= 15 && relevance >= 4 && seriousness >= 4 && substance >= 4;
    const reason = reasons.length > 0 ? reasons.join("；") : "回答已通过审核";
    const suggestion = passed ? "" : (reasons.length > 0 ? "请围绕题目认真回答，给出有实质内容的想法" : "");
    return { passed, score: totalScore, dimensions: { relevance, seriousness, substance }, reason, suggestion };
}

// ========== API 路由 ==========
router.post("/check", async (req, res) => {
    try {
        const { question, answer } = req.body;
        if (!question || answer === undefined) return res.status(400).json({ message: "请提供题目和回答" });
        const result = await aiCheckAnswer(question, answer);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: "AI审核失败", error: err.message });
    }
});

router.post("/batch-check", async (req, res) => {
    try {
        const { answers } = req.body;
        if (!answers || !Array.isArray(answers)) return res.status(400).json({ message: "请提供回答列表" });
        const results = await Promise.all(answers.map(async (item) => {
            const result = await aiCheckAnswer(item.question, item.answer);
            return { questionId: item.questionId, question: item.question, answer: item.answer, ...result };
        }));
        const allPassed = results.every(r => r.passed);
        res.json({ allPassed, results });
    } catch (err) {
        res.status(500).json({ message: "批量审核失败", error: err.message });
    }
});

module.exports = router;