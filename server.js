const { WebSocketServer } = require('./ws.js')

const server = new WebSocketServer()

server.on('headers', ({headers}) => {
  console.log(headers)
})

server.on('data', (message) => {
  if (!message) return;

  const data = JSON.parse(message);
  console.log('Message received:', data);
})

server.listen()
