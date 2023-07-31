const { WebSocketServer } = require('./ws.js')
const { setTimeout: sleep } = require('node:timers/promises')
const crypto = require('crypto')
const server = new WebSocketServer()

const api = {
  auth: async (login, passowrd) => {
    await sleep(1000)
    console.log('auth', login)
    if (login === 'admin') {
      return {
        token: crypto.randomBytes(20).toString('hex')
      }
    }
    return {
      error: 'Unauthorized'
    }
  },
  getUsers: () => {
    return [
      { login: 'admin' }
    ]
  }
}


server.on('headers', ({headers}) => {
  console.log(headers)
})

server.on('data', async (data, reply) => {
  if (!data) return;

  const { method, args = [] } = JSON.parse(data)
  if (!api[method]) {
    return reply({
      error: "Not Found"
    })
  }

  try {
    const result = await api[method](...args)
    return reply(result)
  } catch(e) {
    return reply({
      error: e.message
    })
  }
})

server.listen()
