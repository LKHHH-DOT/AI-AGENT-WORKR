const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "questionnaires.json");

function ensureDataFile() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, "[]", "utf8");
        }
    } catch (e) {
        console.error("Cannot create data file:", e.message);
    }
}

function loadAll() {
    ensureDataFile();
    try {
        const raw = fs.readFileSync(DATA_FILE, "utf8");
        return JSON.parse(raw) || [];
    } catch (e) {
        return [];
    }
}

function saveAll(data) {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

module.exports = {
    async create(doc) {
        const all = loadAll();
        const entry = {
            _id: String(Date.now()) + String(Math.random()).slice(2, 8),
            ...doc,
            questions: doc.questions || [],
            responses: doc.responses || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        all.push(entry);
        saveAll(all);
        return entry;
    },
    async findById(id) {
        return loadAll().find(q => q._id === id) || null;
    },
    async find() {
        return loadAll().reverse();
    },
    async findByIdAndUpdate(id, data) {
        const all = loadAll();
        const idx = all.findIndex(q => q._id === id);
        if (idx !== -1) {
            Object.assign(all[idx], data, { updatedAt: new Date().toISOString() });
            saveAll(all);
            return all[idx];
        }
        return null;
    },
    async deleteById(id) {
        const all = loadAll();
        const idx = all.findIndex(q => q._id === id);
        if (idx === -1) return false;
        all.splice(idx, 1);
        saveAll(all);
        return true;
    }
};