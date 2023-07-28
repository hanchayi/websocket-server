const { WebSocketServer } = require('./ws.js')

const server = new WebSocketServer()

server.on('headers', ({headers}) => {
  console.log(headers)
})

server.listen()
