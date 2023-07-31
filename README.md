# websocket-server

实现一个websocket的server，主要用于学习web socket协议

## 背景

主要为了实现浏览器端的双向通讯机制。

## 连接

websocket是由一个http协议upgrade而来。所以websocket的server必然也是一个http server。

在http请求中出现以下请求头：

```
// Request
{
  connection: 'Upgrade', // Upgrade connect
  upgrade: 'websocket', // Upgrade to websocket
  'sec-websocket-key': '', // Random key string
}
```

websocket-server需用一个固定字符串去加密传入的key，并返回'sec-websocket-accept'
```
// Response
{
  connect: 'Upgrade',
  upgrade: 'websocket',
  'sec-websocket-accept': '' // accepted value from key hash using sha1
}
```

## 传输

websocket协议如下
- 第一个字节： Fin\插件\操作
- 第二个字节： 是否使用mask，请求长度
  - 请求长度=126时 实际长度 = 2个字节65535
  - 请求长度=127是 实际长度 = 8个字节
- 实际长度
- 请求内容

## 问题

1. 为什么要websocket协议而不是直接socket协议？

websocket基于socket和http一样是应用层的协议，和socket不在一个层级

2. 为什么要websocket协议的sec-websocket-key需要加密
- 确保server理解websocket协议
- 防止客户端意外请求websocket服务

3. 为什么要mask websocket的数据
屏蔽的原因是使 websocket 流量看起来与正常的 HTTP 流量不同，并且变得完全不可预测。
否则，任何尚未升级以理解 Websocket 协议的网络基础设施设备都可能将其误认为正常的 http 流量，从而导致各种问题。


## Reference

- [implementing-a-websocket-server-from-scratch](https://betterprogramming.pub/implementing-a-websocket-server-from-scratch-in-node-js-a1360e00a95f)
