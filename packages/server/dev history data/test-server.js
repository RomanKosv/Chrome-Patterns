const http = require('http');

const server = http.createServer((req, res) => {
  // Логируем каждый входящий запрос в консоль сервера
  console.log(`Запрос получен: ${req.method} ${req.url}`);

  // Настройка заголовков (CORS и тип данных)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.writeHead(200, { 'Content-Type': 'application/json' });

  // Отправляем ответ
  res.end(JSON.stringify({ 
    status: "success", 
    message: "Сервер работает!",
    receivedUrl: req.url 
  }));
});

const PORT = 3500;
server.listen(PORT, () => {
  console.log(`=== Тестовый сервер запущен на http://localhost:${PORT} ===`);
});
