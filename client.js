const WebSocket = require('ws')

const ws = new WebSocket('ws://localhost:4000');

ws.onopen = () => {
  console.log('ws opened')
  ws.send(JSON.stringify({
    hello: 'world'
  }))
}

