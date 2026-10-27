const fs = require('node:fs/promises');
const path = require('node:path');

const DB_PATH = path.join(__dirname, '..', 'settings.json');

async function readDB() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        if (!data.trim()) return {};
        return JSON.parse(data);
    } catch (e) {
        if (e.code === 'ENOENT') {
            await writeDB({});
            return {};
        }
        console.error('Error reading settings.json:', e);
        return null;
    }
}

async function writeDB(data) {
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 4), 'utf-8');
    } catch (e) {
        console.error('Error writing to settings.json:', e);
    }
}

async function getSetting(guildId, key) {
    const db = await readDB();
    if (!db || !db[guildId]) return null;
    return db[guildId][key] || null;
}

async function setSetting(guildId, key, value) {
    const db = await readDB();
    if (!db) {
        console.error('Refusing to write settings.json because reading failed');
        return;
    }
    if (!db[guildId]) db[guildId] = {};
    db[guildId][key] = value;
    await writeDB(db);
}

module.exports = { getSetting, setSetting };
