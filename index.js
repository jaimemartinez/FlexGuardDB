const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

const Database = require("./db.js");
const TokenDatabase = require("./token.js");
const UserDatabase = require("./user.js");

const app = express();
const db = new Database();
const tokenDb = new TokenDatabase();
const userDb = new UserDatabase();

const PORT = process.env.PORT || 3000;

const ACCESS_SECRET = "your-access-secret-key";
const REFRESH_SECRET = "your-refresh-secret-key";

app.use(bodyParser.json());

// Function to generate access and refresh tokens
function generateTokens(user) {
    const accessToken = jwt.sign(user, ACCESS_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign(user, REFRESH_SECRET, { expiresIn: "7d" });
    tokenDb.addAccessToken(accessToken);
    tokenDb.addRefreshToken(refreshToken);
    return { accessToken, refreshToken };
}

// Middleware to verify access tokens
function authenticateToken(req, res, next) {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token || !tokenDb.hasAccessToken(token)) {
        return res.status(401).send("Access denied. No valid token provided.");
    }

    jwt.verify(token, ACCESS_SECRET, (err, user) => {
        if (err)
            return res.status(403).send("Invalid or expired access token.");
        req.user = user;
        next();
    });
}

// Serve HTML documentation on GET /
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "doc.html"));
});

// User registration
app.post("/register", async (req, res) => {
    const { email, username, password } = req.body;
    try {
        await userDb.registerUser(email, username, password);
        res.status(201).send("User registered successfully.");
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// User login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await userDb.validateUser(username, password);
        const tokens = generateTokens({ username: user.username });
        res.json(tokens);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Refresh token
app.post("/refresh", (req, res) => {
    const { token } = req.body;
    if (!token || !tokenDb.hasRefreshToken(token)) {
        return res.status(401).send("Invalid refresh token.");
    }

    jwt.verify(token, REFRESH_SECRET, (err, user) => {
        if (err)
            return res.status(403).send("Invalid or expired refresh token.");

        const newAccessToken = jwt.sign(
            { username: user.username },
            ACCESS_SECRET,
            { expiresIn: "15m" },
        );
        tokenDb.addAccessToken(newAccessToken);
        res.json({ accessToken: newAccessToken });
    });
});

// Logout
app.post("/logout", (req, res) => {
    const { accessToken, refreshToken } = req.body;
    if (accessToken) tokenDb.removeAccessToken(accessToken);
    if (refreshToken) tokenDb.removeRefreshToken(refreshToken);
    res.status(200).send("Logged out successfully.");
});

// Create a new table
app.post("/createTable", authenticateToken, (req, res) => {
    const { tableName, columns } = req.body;
    try {
        db.createTable(tableName, columns);
        res.status(201).send(`Table '${tableName}' created.`);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Create table if not exists
app.post("/createTableIfNotExist", authenticateToken, (req, res) => {
    const { tableName, columns } = req.body;
    try {
        db.createTableIfNotExist(tableName, columns);
        res.status(201).send(
            `Table '${tableName}' created if not already present.`,
        );
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Insert data into a table
app.post("/insert", authenticateToken, (req, res) => {
    const { tableName, values } = req.body;
    try {
        db.insert(tableName, values);
        res.status(201).send("Data inserted successfully.");
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Select data from a table (Simple or Complex) - POST
// Select data from a table (POST)
app.post("/select", authenticateToken, (req, res) => {
    const { tableName, query, conditions } = req.body;

    try {
        let finalConditions = [];

        // Handle simple query condition if 'query' is provided
        if (query) {
            const { column, operator, value } = query;
            if (!column || !operator || value === undefined) {
                throw new Error(
                    "Invalid query format. 'column', 'operator', and 'value' are required.",
                );
            }
            finalConditions.push({ column, operator, value });
        }

        // Merge complex conditions if provided
        if (conditions && Array.isArray(conditions)) {
            finalConditions = finalConditions.concat(conditions);
        }

        console.log("Final Conditions:", finalConditions); // Debugging log

        // Call the database select method with constructed conditions
        const rows = db.select(tableName, finalConditions);
        res.status(200).json(rows);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// Update data in a table
app.post("/update", authenticateToken, (req, res) => {
    const { tableName, conditions, updates } = req.body;
    try {
        const updatedCount = db.update(tableName, conditions, updates);
        res.status(200).send(`${updatedCount} row(s) updated.`);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Alter a table structure
app.post("/alterTable", authenticateToken, (req, res) => {
    const { tableName, action, column } = req.body;
    try {
        db.alterTable(tableName, action, column);
        res.status(200).send(`Table '${tableName}' altered successfully.`);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Get all table names
app.get("/tableNames", authenticateToken, (req, res) => {
    try {
        const tableNames = db.getTableNames();
        res.status(200).json(tableNames);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Get table schema
app.get("/tableSchema", authenticateToken, (req, res) => {
    const { tableName } = req.query;
    try {
        const schema = db.getTableSchema(tableName);
        res.status(200).json(schema);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
