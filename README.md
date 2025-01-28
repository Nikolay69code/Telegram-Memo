### Шаг 1: Подготовка окружения

#### Установка необходимых компонентов на Ubuntu
1. **Обновите систему**:
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

2. **Установите Node.js и npm**:
    ```bash
    curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
    sudo apt install -y nodejs
    ```

3. **Установите MongoDB (если планируете использовать базу данных для хранения изображений)**:
    ```bash
    sudo apt install -y mongodb
    sudo systemctl start mongodb
    sudo systemctl enable mongodb
    ```

4. **Установите Nginx** для проксирования запросов:
    ```bash
    sudo apt install -y nginx
    ```

5. **Установите Git** для управления версиями:
    ```bash
    sudo apt install -y git
    ```

6. **Установите Certbot для получения SSL-сертификатов**:
    ```bash
    sudo apt install -y certbot python3-certbot-nginx
    ```

### Шаг 2: Создание проекта

#### Файловая структура проекта
```
telegram-memo-game/
│
├── public/                      # Статические файлы (HTML, CSS, JS)
│   ├── index.html               # Главная страница
│   ├── styles.css               # Стили
│   └── script.js                # Логика игры
│
├── src/                         # Исходные файлы сервера
│   ├── app.js                   # Основной файл сервера
│   ├── routes/                  # Роутинг API
│   │   ├── gameRoutes.js        # Роуты для игры
│   │   └── adminRoutes.js       # Роуты для администрирования
│   └── models/                  # Модели данных (для MongoDB)
│       └── CardModel.js         # Модель карточки
│
├── .env                         # Переменные окружения
├── package.json                 # Конфигурация Node.js
└── README.md                    # Документация проекта
```

#### Инициализация проекта
```bash
mkdir telegram-memo-game
cd telegram-memo-game
npm init -y
```

#### Установка зависимостей
```bash
npm install express mongoose dotenv cors body-parser multer
```

### Шаг 3: Написание кода

#### `public/index.html` — HTML шаблон игры
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Telegram Memo Game</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="game-container"></div>
    <button id="share-result">Share Result</button>
    <script src="script.js"></script>
</body>
</html>
```

#### `public/styles.css` — CSS стили
```css
#game-container {
    display: grid;
    grid-template-columns: repeat(4, 100px);
    grid-template-rows: repeat(4, 100px);
    gap: 10px;
}
.card {
    width: 100px;
    height: 100px;
    background-color: lightgray;
    cursor: pointer;
}
```

#### `public/script.js` — Логика игры
```javascript
let cards = [];
let flippedCards = [];
let attempts = 0;
let startTime;

document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/cards')
        .then(response => response.json())
        .then(data => {
            cards = data.cards;
            renderCards();
        });
});

function renderCards() {
    const container = document.getElementById('game-container');
    container.innerHTML = '';
    cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.dataset.index = index;
        cardElement.addEventListener('click', flipCard);
        container.appendChild(cardElement);
    });
}

function flipCard(event) {
    if (flippedCards.length === 2) return;
    const cardIndex = event.target.dataset.index;
    const cardElement = event.target;
    cardElement.style.backgroundImage = `url(${cards[cardIndex].image})`;
    flippedCards.push({index: cardIndex, element: cardElement});
    if (flippedCards.length === 2) {
        checkMatch();
    } else if (flippedCards.length === 1) {
        if (!startTime) {
            startTime = Date.now();
        }
        attempts++;
    }
}

function checkMatch() {
    const [firstCard, secondCard] = flippedCards;
    if (cards[firstCard.index].id === cards[secondCard.index].id) {
        flippedCards = [];
    } else {
        setTimeout(() => {
            firstCard.element.style.backgroundImage = '';
            secondCard.element.style.backgroundImage = '';
            flippedCards = [];
        }, 1000);
    }
    if (isGameOver()) {
        const endTime = Date.now();
        const timeTaken = Math.floor((endTime - startTime) / 1000);
        alert(`Game Over! Attempts: ${attempts}, Time: ${timeTaken} seconds`);
        document.getElementById('share-result').style.display = 'block';
        // Share result logic here
    }
}

function isGameOver() {
    return flippedCards.length === 0 && cards.every(card => !card.flipped);
}

document.getElementById('share-result').addEventListener('click', () => {
    const endTime = Date.now();
    const timeTaken = Math.floor((endTime - startTime) / 1000);
    const message = `I finished the Telegram Memo Game in ${timeTaken} seconds with ${attempts} attempts!`;
    navigator.share({
        title: 'Telegram Memo Game',
        text: message,
        url: window.location.href
    }).catch(console.error);
});
```

#### `src/app.js` — Основной файл сервера
```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Routes
const gameRoutes = require('./routes/gameRoutes');
const adminRoutes = require('./routes/adminRoutes');
app.use('/api', gameRoutes);
app.use('/admin', adminRoutes);

// Serve static files
app.use(express.static('public'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

#### `src/routes/gameRoutes.js` — Роуты для API
```javascript
const express = require('express');
const router = express.Router();
const CardModel = require('../models/CardModel');

router.get('/cards', async (req, res) => {
    try {
        const cards = await CardModel.find().lean();
        res.json({ cards });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
```

#### `src/routes/adminRoutes.js` — Роуты для администрирования
```javascript
const express = require('express');
const router = express.Router();
const CardModel = require('../models/CardModel');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const newCard = new CardModel({
            id: req.body.id,
            image: `/uploads/${req.file.filename}`
        });
        await newCard.save();
        res.json({ message: 'Card added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
```

#### `src/models/CardModel.js` — Модель данных
```javascript
const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
    id: String,
    image: String,
});

module.exports = mongoose.model('Card', CardSchema);
```

#### `.env` — Переменные окружения
```
MONGO_URI=mongodb://localhost:27017/memo_game
PORT=3000
```

### Шаг 4: Настройка Nginx

1. **Создайте конфигурационный файл Nginx**:
    ```bash
    sudo nano /etc/nginx/sites-available/telegram-memo-game
    ```

2. **Добавьте следующие строки**:
    ```
    server {
        listen 80;
        server_name your_domain_or_ip;

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        location /uploads/ {
            alias /path/to/your/project/uploads/;
        }
    }
    ```

3. **Активируйте конфигурацию**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/telegram-memo-game /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

### Шаг 5: Получение SSL-сертификата

1. **Получите SSL-сертификат с помощью Certbot**:
    ```bash
    sudo certbot --nginx -d your_domain_or_ip
    ```

2. **Перезапустите Nginx**:
    ```bash
    sudo systemctl restart nginx
    ```

### Шаг 6: Размещение приложения на сервере

1. **Загрузите ваш проект на сервер**:
    ```bash
    git clone https://github.com/yourusername/telegram-memo-game.git
    cd telegram-memo-game
    npm install
    ```

2. **Создайте директорию для загрузки изображений**:
    ```bash
    mkdir uploads
    ```

3. **Запустите сервер**:
    ```bash
    node src/app.js
    ```

4. **Используйте pm2 для запуска сервера в фоновом режиме**:
    ```bash
    sudo npm install -g pm2
    pm2 start src/app.js --name "telegram-memo-game"
    pm2 startup
    pm2 save
    ```

### Шаг 7: Интеграция с Telegram Mini Apps

1. **Создайте бота в Telegram** и получите токен.
2. **Создайте мини-приложение** и добавьте его в меню бота.
3. **Интегрируйте игру с Telegram API** для отправки результата игры.

#### Пример интеграции с Telegram API
```javascript
const axios = require('axios');

async function shareResult(chatId, message) {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`;
    await axios.post(url, {
        chat_id: chatId,
        text: message,
    });
}
```

### Заключение

Это общее руководство по созданию Telegram Mini App игры "Мемо". Вам нужно будет адаптировать и расширить его в зависимости от ваших конкретных требований и условий. Не забудьте протестировать все аспекты игры перед публикацией и убедитесь, что она работает корректно на всех устройствах.