const fs = require("fs");
const zlib = require("zlib");
const TOKEN_DB_FILE = "./tokens.json.gz";

class TokenDatabase {
    constructor() {
        this.tokens = { access: new Set(), refresh: new Set() }; // In-memory token storage
        this.loadFromFile(); // Load tokens from GZ file
    }

    saveToFile() {
        const data = JSON.stringify({
            access: [...this.tokens.access],
            refresh: [...this.tokens.refresh],
        });
        const compressed = zlib.gzipSync(data);
        fs.writeFileSync(TOKEN_DB_FILE, compressed);
        console.log("Tokens saved to disk.");
    }

    loadFromFile() {
        if (fs.existsSync(TOKEN_DB_FILE)) {
            const compressed = fs.readFileSync(TOKEN_DB_FILE);
            const data = zlib.gunzipSync(compressed).toString("utf-8");
            const parsed = JSON.parse(data);
            this.tokens.access = new Set(parsed.access);
            this.tokens.refresh = new Set(parsed.refresh);
            console.log("Tokens loaded from disk.");
        } else {
            console.log("No token database found. Starting fresh.");
        }
    }

    addAccessToken(token) {
        this.tokens.access.add(token);
        this.saveToFile();
    }

    addRefreshToken(token) {
        this.tokens.refresh.add(token);
        this.saveToFile();
    }

    hasAccessToken(token) {
        return this.tokens.access.has(token);
    }

    hasRefreshToken(token) {
        return this.tokens.refresh.has(token);
    }

    removeAccessToken(token) {
        this.tokens.access.delete(token);
        this.saveToFile();
    }

    removeRefreshToken(token) {
        this.tokens.refresh.delete(token);
        this.saveToFile();
    }
}

module.exports = TokenDatabase;
