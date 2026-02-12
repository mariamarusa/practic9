const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
const PORT = 3000;

//  НАСТРОЙКА CORS 
// Разрешаем запросы с любых источников 
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Добавляем заголовки для всех ответов
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

app.use(express.json());


app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Сервер работает!',
        timestamp: new Date().toISOString()
    });
});

// РЕГИСТРАЦИЯ 
app.post('/api/register', async (req, res) => {
    console.log('\n Запрос на регистрацию:', req.body);
    
    try {
        const { username, email, password } = req.body;
        
        // Проверка полей
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Все поля обязательны для заполнения'
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Пароль должен быть не менее 6 символов'
            });
        }
        
        // Проверка существования пользователя
        db.findUserByUsername(username, async (err, existingUser) => {
            if (err) {
                console.error('Ошибка БД:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Ошибка сервера'
                });
            }
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Имя пользователя уже занято'
                });
            }
            
            // Проверка email
            db.findUserByEmail(email, async (err, existingEmail) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Ошибка сервера'
                    });
                }
                
                if (existingEmail) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email уже зарегистрирован'
                    });
                }
                
                // Хеширование пароля
                const hashedPassword = await bcrypt.hash(password, 10);
                
                // Сохранение пользователя
                db.addUser(username, email, hashedPassword, (err, userId) => {
                    if (err) {
                        console.error('Ошибка сохранения:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Ошибка при сохранении пользователя'
                        });
                    }
                    
                    console.log(` Пользователь создан: ${username} (ID: ${userId})`);
                    
                    res.json({
                        success: true,
                        message: 'Регистрация успешна!',
                        userId: userId
                    });
                });
            });
        });
        
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// АВТОРИЗАЦИЯ 
app.post('/api/login', async (req, res) => {
    console.log('\n Запрос на авторизацию:', req.body.username);
    
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Все поля обязательны'
            });
        }
        
        // Поиск пользователя
        db.findUserByUsername(username, async (err, user) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Ошибка сервера'
                });
            }
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Неверное имя пользователя или пароль'
                });
            }
            
            // Проверка пароля
            const isMatch = await bcrypt.compare(password, user.password);
            
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Неверное имя пользователя или пароль'
                });
            }
            
            console.log(`✅ Вход выполнен: ${username} (ID: ${user.id})`);
            
            res.json({
                success: true,
                message: 'Вход выполнен успешно!',
                userId: user.id
            });
        });
        
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// ПОЛУЧЕНИЕ ПОЛЬЗОВАТЕЛЯ
app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    
    db.getUserById(userId, (err, user) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Ошибка сервера'
            });
        }
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }
        
        res.json({
            success: true,
            user: user
        });
    });
});

// СПИСОК ПОЛЬЗОВАТЕЛЕЙ 
app.get('/api/users', (req, res) => {
    db.getAllUsers((err, users) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Ошибка сервера'
            });
        }
        
        res.json({
            success: true,
            users: users
        });
    });
});

//  ЗАПУСК СЕРВЕРА 
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log(` Сервер запущен: http://localhost:${PORT}`);
    console.log('='.repeat(50));
    console.log('\n📋 Маршруты:');
    console.log('   GET  /api/test     - проверка');
    console.log('   POST /api/register - регистрация');
    console.log('   POST /api/login    - вход');
    console.log('   GET  /api/user/:id - профиль');
    console.log('   GET  /api/users    - все пользователи');
    console.log('\n' + '='.repeat(50));
});