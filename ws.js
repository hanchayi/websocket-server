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
    this.opcodes = {
      text: 0x01,
      close: 0x08,
    }
  }

  /**
   * 解析数据帧
   * @param {Buffer} buffer
   *
   *
   */
  parseFrame(buffer) {
    // 第一个字节
    const firstByte = buffer.readUint8(0)
    // 第一个字节后八位代表操作
    const opCode = firstByte & 0b00001111

    if (opCode === this.opcodes.close) {
      this.emit('close');
      return null
    } else if (opCode !== this.opcodes.text) {
      return
    }

    const secondByte = buffer.readUint8(1)
    // 第二个字节后七位
    let payloadLength = secondByte & 0b01111111;
    let offset = 2;

    if (payloadLength === 126) {
      offset += 2 // 两个字节 65536
    } else if (payloadLength === 127) {
      offset += 8 // 八个字节
    }

    // 第二个字节第一位 标志是否mask
    const isMasked = Boolean((secondByte >>> 7) & 0b00000001);
    if (isMasked) {
      const maskKey = buffer.readUInt32BE(offset) // read a 4byte mask key
      offset += 4
      const payload = buffer.subarray(offset)
      const result = this._unmask(payload, maskKey)
      return result.toString('utf-8')
    }

    return buffer.subarray(offset).toString('utf-8')
  }

  /**
   * unmask
   * https://www.rfc-editor.org/rfc/rfc6455#section-5.3
   * @param {Buffer} payload
   * @param {number} maskingKey
   */
  _unmask(payload, maskingKey) {
    const result = Buffer.alloc(payload.byteLength)
    for (let i = 0; i < payload.byteLength; i++) {
      // j = i MOD 4
      const j = i % 4;
      // 取masking key 第j个字节  masking-key-octet-j：为mask key第j字节。
      // [byte1][byte2][byte3][byte4]
      const maskKeyByteShift = j === 3 ? 0 : (3 - j) << 3
      const maskKeyByte = (maskKeyByteShift === 0 ? maskingKey : maskingKey >>> maskKeyByteShift) & 0b11111111;
      // transformed-octet-i = original-octet-i XOR masking-key-octet-j
      const transformedByte = maskKeyByte ^ payload.readUInt8(i);
      result.writeUInt8(transformedByte, i);
    }
    return result
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

      socket.on('data', (buffer) => {
        this.emit('data', this.parseFrame(buffer))
      })

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
  }

  listen() {
    console.log(`WebSocket server listening on port ${this.port}`);
    this._server.listen(this.port)
  }
}


module.exports = {
  WebSocketServer
}
