const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "users.json");

function ensureFile() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, "[]", "utf8");
        }
    } catch (e) {}
}

function loadAll() {
    ensureFile();
    try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) || []; }
    catch (e) { return []; }
}

function saveAll(data) {
    ensureFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

module.exports = {
    async create(user) {
        const all = loadAll();
        const entry = {
            _id: "u_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
            ...user,
            createdAt: new Date().toISOString()
        };
        all.push(entry);
        saveAll(all);
        return entry;
    },
    async findByEmail(email) {
        return loadAll().find(u => u.email === email) || null;
    },
    async findById(id) {
        return loadAll().find(u => u._id === id) || null;
    },
    async find() {
        return loadAll();
    },
    async findByIdAndUpdate(id, data) {
        const all = loadAll();
        const idx = all.findIndex(u => u._id === id);
        if (idx === -1) return null;
        Object.assign(all[idx], data);
        saveAll(all);
        return all[idx];
    },
};