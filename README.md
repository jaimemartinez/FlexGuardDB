
# FlexGuardDB: Node.js API with JWT Authentication and Dynamic Database Management

## Overview

FlexGuardDB is a **Node.js-based RESTful API** offering powerful **user authentication** and **database management** capabilities. It allows users to **create custom tables**, manage their data through CRUD operations, and securely handle authentication using **JWT tokens**.

---

## Key Features

- **User Authentication**:
  - Register, Login, Logout, and Refresh Tokens with **JWT**.
  - **Access tokens** (15 minutes) for short-term sessions.
  - **Refresh tokens** (7 days) for long-term access continuity.
  - Secure password hashing using **bcrypt**.

- **Database Operations**:
  - Dynamically create tables with **custom schemas**, including primary keys and auto-increment fields.
  - Perform **Insert, Update, and Select** operations with **complex conditions**.
  - Supports **AND/OR operators** and various comparison operators (`==`, `>`, `<`, etc.).

- **Token Management**:
  - Tokens are stored in **compressed JSON files** to ensure persistence across restarts.
  - Both **access tokens** and **refresh tokens** are invalidated during logout.

- **Supported Data Types**:
  - INTEGER, STRING, BOOLEAN, and DATE.

---

## Use Case Flow

1. **Register and Login**:
   - A user registers and logs in to receive **access and refresh tokens**.

2. **Create a Table**:
   - The user creates a new table dynamically, defining columns with primary keys and auto-increment if needed.

3. **Insert Data**:
   - The user inserts rows into the table with values matching the schema.

4. **Query Data**:
   - Users query data with **complex conditions** using logical operators (`AND`, `OR`).

5. **Token Refresh**:
   - When the access token expires, the refresh token is used to get a **new access and refresh token**.

6. **Logout**:
   - Logging out invalidates both **access and refresh tokens**, preventing unauthorized access.

---

## Authentication Endpoints

### POST /register
Register a new user.

#### Request:
```json
{
    "email": "user@example.com",
    "username": "user123",
    "password": "Password@123"
}
```
#### Responses:
- **201 Created**: User registered successfully.
- **400 Bad Request**: Missing or invalid fields.
- **409 Conflict**: Username or email already exists.

---

### POST /login
Log in and receive access and refresh tokens.

#### Request:
```json
{
    "username": "user123",
    "password": "Password@123"
}
```
#### Responses:
- **200 OK**: Login successful, with tokens returned.
- **401 Unauthorized**: Invalid credentials.

---

### POST /logout
Log out and invalidate tokens.

#### Request:
```json
{
    "accessToken": "access-token",
    "refreshToken": "refresh-token"
}
```
#### Responses:
- **200 OK**: Logged out successfully.
- **400 Bad Request**: Invalid tokens.
- **401 Unauthorized**: Invalid or expired access token.

---

### POST /refresh
Refresh tokens by issuing new access and refresh tokens.

#### Request:
```json
{
    "token": "refresh-token"
}
```
#### Responses:
- **200 OK**: Tokens refreshed, with new access and refresh tokens returned.
- **401 Unauthorized**: Invalid or expired refresh token.

---

## Database Operations

### POST /createTable
Create a new table with a custom schema.

#### Request:
```json
{
    "tableName": "users",
    "columns": [
        { "name": "id", "type": "INTEGER", "primaryKey": true, "autoIncrement": true },
        { "name": "name", "type": "STRING" },
        { "name": "age", "type": "INTEGER" }
    ]
}
```
#### Responses:
- **201 Created**: Table created successfully.
- **400 Bad Request**: Invalid table schema.
- **409 Conflict**: Table already exists.

---

### POST /insert
Insert a row into a table.

#### Request:
```json
{
    "tableName": "users",
    "values": [null, "Alice", 25]
}
```
#### Responses:
- **201 Created**: Data inserted successfully.
- **400 Bad Request**: Invalid data or table does not exist.
- **409 Conflict**: Duplicate primary key value.

---

### POST /select
Query data with optional conditions and logical operators.

#### Request:
```json
{
    "tableName": "users",
    "conditions": [
        [{ "column": "age", "operator": ">", "value": 20 }, "AND", { "column": "name", "operator": "!=", "value": "Bob" }]
    ]
}
```
#### Responses:
- **200 OK**: Array of matching rows.
- **400 Bad Request**: Invalid query or table does not exist.

---

### POST /update
Update rows matching specific conditions.

#### Request:
```json
{
    "tableName": "users",
    "conditions": [{ "column": "id", "operator": "==", "value": 1 }],
    "updates": { "age": 30 }
}
```
#### Responses:
- **200 OK**: Number of rows updated.
- **400 Bad Request**: Invalid update data or table does not exist.

---

## Operators and Data Types

### Comparison Operators:
- **==**: Equals
- **!=**: Not Equals
- **>**: Greater Than
- **>=**: Greater Than or Equal
- **<**: Less Than
- **<=**: Less Than or Equal

### Supported Data Types:
- **INTEGER**: Whole numbers.
- **STRING**: Text values.
- **BOOLEAN**: True/false values.
- **DATE**: Date objects.

---

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Server**:
   ```bash
   node index.js
   ```

4. **Access the API Documentation**:
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## Token Storage and Persistence

- **Tokens** and **user data** are saved in **compressed JSON files** to ensure persistence across server restarts.
- **Access tokens** are valid for **15 minutes**, while **refresh tokens** are valid for **7 days**.

---

## License

This project is licensed under the MIT License.
