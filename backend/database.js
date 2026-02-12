const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Создание таблицы пользователей
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    console.log('✅ База данных подключена');
});

// Функция для добавления пользователя
function addUser(username, email, password, callback) {
    const sql = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
    db.run(sql, [username, email, password], function(err) {
        callback(err, this?.lastID);
    });
}

// Функция для поиска пользователя по имени
function findUserByUsername(username, callback) {
    const sql = `SELECT * FROM users WHERE username = ?`;
    db.get(sql, [username], callback);
}

// Функция для поиска пользователя по email
function findUserByEmail(email, callback) {
    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], callback);
}

// Функция для получения пользователя по ID
function getUserById(id, callback) {
    const sql = `SELECT id, username, email, created_at FROM users WHERE id = ?`;
    db.get(sql, [id], callback);
}

// Функция для получения всех пользователей
function getAllUsers(callback) {
    const sql = `SELECT id, username, email, created_at FROM users`;
    db.all(sql, [], callback);
}

module.exports = {
    db,
    addUser,
    findUserByUsername,
    findUserByEmail,
    getUserById,
    getAllUsers
};