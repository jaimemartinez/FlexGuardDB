const fs = require("fs");
const zlib = require("zlib");
const bcrypt = require("bcrypt");
const USER_DB_FILE = "./users.json.gz";

class UserDatabase {
    constructor() {
        this.users = []; // In-memory storage for users
        this.loadFromFile(); // Load users from the GZ file
    }

    saveToFile() {
        const data = JSON.stringify(this.users);
        const compressed = zlib.gzipSync(data);
        fs.writeFileSync(USER_DB_FILE, compressed);
        console.log("Users saved to disk.");
    }

    loadFromFile() {
        if (fs.existsSync(USER_DB_FILE)) {
            const compressed = fs.readFileSync(USER_DB_FILE);
            const data = zlib.gunzipSync(compressed).toString("utf-8");
            this.users = JSON.parse(data);
            console.log("Users loaded from disk.");
        } else {
            console.log("No user database found. Starting fresh.");
        }
    }

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error("Invalid email format.");
        }
    }

    // Validate password complexity
    validatePassword(password) {
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        if (!passwordRegex.test(password)) {
            throw new Error(
                "Password must be at least 8 characters long, with at least one uppercase letter, one lowercase letter, one number, and one special character.",
            );
        }
    }

    async registerUser(email, username, password) {
        const userExists = this.users.some(
            (user) => user.username === username || user.email === email,
        );
        if (userExists)
            throw new Error("User with this email or username already exists.");

        this.validateEmail(email);
        this.validatePassword(password);

        const hashedPassword = await bcrypt.hash(password, 10);
        this.users.push({ email, username, password: hashedPassword });
        this.saveToFile();
    }

    async validateUser(username, password) {
        const user = this.users.find((user) => user.username === username);
        if (!user) throw new Error("Invalid username or password.");

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error("Invalid username or password.");

        return user;
    }
}

module.exports = UserDatabase;
