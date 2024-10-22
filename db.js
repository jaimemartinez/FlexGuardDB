const fs = require("fs");
const zlib = require("zlib");
const DATABASE_FILE = "./database.json.gz";

class Database {
    constructor() {
        this.tables = {};
        this.loadFromFile();
    }

    // Create a new table
    createTable(tableName, columns) {
        if (this.tables[tableName]) {
            throw new Error(`Table '${tableName}' already exists.`);
        }

        this.tables[tableName] = {
            columns: columns,
            rows: [],
            autoIncrement: 1, // Start auto-increment counter at 1
        };

        console.log(`Table '${tableName}' created with schema:`, columns);
        this.saveToFile(); // Save after creating the table
    }

    // Create a table if it doesn't exist
    createTableIfNotExist(tableName, columns) {
        if (!this.tables[tableName]) {
            this.createTable(tableName, columns);
        } else {
            console.log(
                `Table '${tableName}' already exists. No changes made.`,
            );
        }
    }

    // Insert a new row into a table
    insert(tableName, values) {
        const table = this.tables[tableName];
        if (!table) throw new Error(`Table '${tableName}' does not exist.`);

        const primaryKeyIndex = table.columns.findIndex(
            (col) => col.primaryKey && col.type === "INTEGER",
        );

        // Assign the next auto-increment value to the primary key if needed
        if (
            primaryKeyIndex !== -1 &&
            (values[primaryKeyIndex] === null ||
                values[primaryKeyIndex] === undefined)
        ) {
            values[primaryKeyIndex] = table.autoIncrement++;
        }

        if (values.length !== table.columns.length) {
            throw new Error(
                `Expected ${table.columns.length} values, but got ${values.length}.`,
            );
        }

        const row = [...values];
        table.rows.push(row);

        console.log(`Inserted row into '${tableName}':`, row);
        this.saveToFile(); // Save after inserting a row
    }

    update(tableName, conditions = [], updates = {}) {
        const table = this.tables[tableName];
        if (!table) throw new Error(`Table '${tableName}' does not exist.`);

        let updatedCount = 0;

        const evaluateCondition = (row, condition) => {
            const { column, operator, value } = condition;
            const columnIndex = table.columns.findIndex(
                (col) => col.name === column,
            );
            if (columnIndex === -1) {
                throw new Error(`Column '${column}' does not exist.`);
            }
            const cellValue = row[columnIndex];
            switch (operator) {
                case "==":
                    return cellValue === value;
                case "!=":
                    return cellValue !== value;
                case ">":
                    return cellValue > value;
                case ">=":
                    return cellValue >= value;
                case "<":
                    return cellValue < value;
                case "<=":
                    return cellValue <= value;
                default:
                    throw new Error(`Invalid operator: '${operator}'`);
            }
        };

        table.rows.forEach((row) => {
            if (conditions.every((cond) => evaluateCondition(row, cond))) {
                Object.entries(updates).forEach(([key, value]) => {
                    const columnIndex = table.columns.findIndex(
                        (col) => col.name === key,
                    );
                    if (columnIndex === -1) {
                        throw new Error(`Column '${key}' does not exist.`);
                    }
                    row[columnIndex] = value;
                });
                updatedCount++;
            }
        });

        this.saveToFile();
        return updatedCount;
    }

    select(tableName, conditions = []) {
        const table = this.tables[tableName];
        if (!table) throw new Error(`Table '${tableName}' does not exist.`);

        console.log(
            `Table Columns:`,
            table.columns.map((col) => col.name),
        ); // Debugging log

        const evaluateCondition = (row, condition) => {
            const [{ column, operator, value }] = condition;

            console.log(` conditions ${JSON.stringify(condition)}`);
            // Find the index of the column in the table schema
            const columnIndex = table.columns.findIndex(
                (col) => col.name === column,
            );

            if (columnIndex === -1) {
                console.error(
                    `Column '${column}' not found in the table schema.`,
                );
                throw new Error(`Column '${column}' does not exist.`);
            }

            const cellValue = row[columnIndex]; // Access the cell value at the column index
            console.log(`Evaluating: ${cellValue} ${operator} ${value}`); // Debugging log

            // Evaluate the condition based on the operator
            switch (operator) {
                case "==":
                    return cellValue === value;
                case "!=":
                    return cellValue !== value;
                case ">":
                    return cellValue > value;
                case ">=":
                    return cellValue >= value;
                case "<":
                    return cellValue < value;
                case "<=":
                    return cellValue <= value;
                default:
                    throw new Error(`Invalid operator: '${operator}'`);
            }
        };

        const evaluateComplexCondition = (row, conditions) => {
            if (Array.isArray(conditions[0])) {
                // Handle nested AND/OR conditions
                const [left, operator, right] = conditions;
                switch (operator) {
                    case "AND":
                        return (
                            evaluateComplexCondition(row, left) &&
                            evaluateComplexCondition(row, right)
                        );
                    case "OR":
                        return (
                            evaluateComplexCondition(row, left) ||
                            evaluateComplexCondition(row, right)
                        );
                    default:
                        throw new Error(
                            `Invalid logical operator: '${operator}'`,
                        );
                }
            } else {
                // Handle simple condition object
                return evaluateCondition(row, conditions);
            }
        };

        // Filter rows based on the evaluated conditions
        const filteredRows = table.rows.filter((row) =>
            evaluateComplexCondition(row, conditions),
        );
        console.log(`Filtered Rows:`, filteredRows); // Debugging log

        return filteredRows;
    }

    alterTable(tableName, action, column) {
        const table = this.tables[tableName];
        if (!table) throw new Error(`Table '${tableName}' does not exist.`);

        switch (action) {
            case "ADD":
                if (table.columns.some((col) => col.name === column.name)) {
                    throw new Error(`Column '${column.name}' already exists.`);
                }
                table.columns.push(column);
                table.rows.forEach((row) => row.push(column.default || null));
                break;

            case "MODIFY":
                const index = table.columns.findIndex(
                    (col) => col.name === column.name,
                );
                if (index === -1)
                    throw new Error(`Column '${column.name}' does not exist.`);
                table.columns[index] = { ...table.columns[index], ...column };
                break;

            default:
                throw new Error(
                    `Invalid action: '${action}'. Use 'ADD' or 'MODIFY'.`,
                );
        }

        this.saveToFile();
    }

    getTableNames() {
        return Object.keys(this.tables);
    }

    getTableSchema(tableName) {
        const table = this.tables[tableName];
        if (!table) throw new Error(`Table '${tableName}' does not exist.`);
        return table.columns;
    }

    saveToFile() {
        const data = JSON.stringify(this.tables, (key, value) =>
            value instanceof Set ? [...value] : value,
        );

        const compressed = zlib.gzipSync(data);
        fs.writeFileSync(DATABASE_FILE, compressed);
        console.log("Database saved to disk.");
    }

    loadFromFile() {
        if (fs.existsSync(DATABASE_FILE)) {
            const compressed = fs.readFileSync(DATABASE_FILE);
            const data = zlib.gunzipSync(compressed).toString("utf-8");
            this.tables = JSON.parse(data);

            for (const table of Object.values(this.tables)) {
                table.primaryKeyValues = new Set(table.primaryKeyValues);
            }

            console.log("Database loaded from disk.");
        } else {
            console.log("No existing database found. Starting fresh.");
        }
    }
}

module.exports = Database;
