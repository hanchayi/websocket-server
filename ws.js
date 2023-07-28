const http = require('node:http')
const { EventEmitter } = require('node:events')
const crypto = require('crypto')
// const GUID = '258EDFA5-E914–47DA-95CA-C5AB0DC85B11'
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'

class WebSocketServer extends EventEmitter {

  constructor(options = {}) {
    super()
    this.port = options.port || 4000
    this._init()
  }

  _init() {
    this._server = http.createServer((req, res) => {
      const UPGRADE_REQUIRED = 426
      const body = http.STATUS_CODES[UPGRADE_REQUIRED]
      res.writeHead(UPGRADE_REQUIRED, {
        'Content-Type': 'text/plain',
        'Upgrade': 'WebSocket'
      })
      res.end(body)
    })

    /**
     * request example:
     *
     * GET / HTTP/1.1
     * Connection: Upgrade
     * Upgrade: websocket
     * Sec-WebSocket-Key: kB2x1cO5zjL1ynwrLTSXUQ==
     * Sec-WebSocket-Version: 13
     */
    this._server.on('upgrade', (req, socket) => {
      this.emit('headers', req)

      if (req.headers.upgrade !== 'websocket') {
        socket.end('HTTP/1.1 400 Bad Request')
        return
      }

      const acceptKey = req.headers['sec-websocket-key']
      const acceptValue = this._generateAcceptValue(acceptKey)

      const responseHeaders = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptValue}`
      ]

      socket.write(responseHeaders.concat('\r\n').join('\r\n'))

      this.on('close', () => {
        console.log('closing....', socket);
        socket.destroy();
      });
    })
  }

  _generateAcceptValue(key) {
    const { createHash } = require('crypto');
    const digest = createHash('sha1')
    .update(key + GUID)
    .digest('base64');
    return digest
    // return crypto
    //   .createHash('sha1')
    //   .update(acceptKey + GUID, 'binary')
    //   .digest('base64')
  }

  listen() {
    this._server.listen(this.port)
  }
}


module.exports = {
  WebSocketServer
}
