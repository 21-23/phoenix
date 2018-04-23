# phoenix
Your stable connection to ws server

## Examples
### Node.js
```javascript
const createPhoenix = require('phoenix');
const phoenix = createPhoenix(WebSocketClient, {
    uri: 'ws://127.0.0.1/ws',
    timeout: 500,
    logger: console,
    strategy: createPhoenix.strategies.powerOf2,
});

phoenix
    .on('connected', () => {
        // connected
    })
    .on('disconnected', () => {
        // connected
    })
    .on('message', ({ data }) => {
        // data is the sent message
    });
```
### browser
```javascript
import createPhoenix from 'phoenix';
const phoenix = createPhoenix(WebSocket, {
    uri: 'ws://127.0.0.1/ws',
    timeout: 500,
    logger: console,
    strategy: createPhoenix.strategies.fibonacci,
});

phoenix
    .on('connected', () => {
        // connected
    })
    .on('disconnected', () => {
        // connected
    })
    .on('message', ({ data }) => {
        // data is the sent message
    });
```

## API
```javascript
const createPhoenix = require('phoenix');

const phoenix = createPhoenix(WSClient, options]);
```
Arguments:
* `WSClient` - the class that would be used for connection creation. Should be [WebSocket](https://developer.mozilla.org/en/docs/Web/API/WebSocket) or any other implementation with the same API. Required.
* `options`
  * `uri` - remote WS server full url (e.g. wss://echo.websocket.org). Required.
  * `timeout` - time span between reconnects. Optional. Default to `0`. Depends on selected `strategy`.
  * `logger` - object that implements log interface (actually, 2 methods: `log` and `warn`). Optional. If not passed - fallbacks to `console`. If there's no console - would not log anything. To disable logging set to `null`.
  * `strategy` - reconnect strategy. Optional. Default to `const`. See full list of strategies below.

To stop reconnect from the server it shoud close the WS connection with code `4500`.

### phoenix.destroy();
Has no arguments. Drops the connection, removes all listeners, stops the reconnection if any active.

### phoenix.send(message);
Sends a message to the connection. Returns `true` if connection to server is available, `false` otherwise. Returned `true` does not guarantee message to be sent.

### phoenix.on('eventName', listener);
Subscribes to the event from phoenix. See <a href="#events">events</a> for details. Returns the phoenix instance.
Arguments:
* `eventName` - name of the event
* `listener` - a callback function

### phoenix.off('eventName', listener);
Unsubscribes the given listener from the given event. If `listener` is omitted - all listeners for the given event would be unsubscribed. If both `eventName` and `listener` are omitted - all listeners would be unsubscribed. Returns the phoenix instance.
Arguments:
* `eventName` - name of the event
* `listener` - a callback function

<a name="events"></a>
### Events

#### Event `'connected'`
`function onConnected() { }`
Emitted every time the connection is up.

#### Event `'disconnected'`
`function onDisconnected() { }`
Emitted every time the connection is down.

#### Event `'message'`
`function onMessage({ data }) { }`
Emitted when the client (phoenix) receives a message from server.
* `data` - message from server

## Reconnect strategies
### const
The default one. Takes the `timeout` option as a timspan between reconnects. Constant over time. E.g. `timeout = 67`, then sequence is `67, 67, 67, 67, ...`.

### fibonacci
`timeout` option is ignored. Reconnect is scheduled based on fibonacci sequence in milliseconds. `0, 1, 1, 2, 3, 5, 8, 13, ...`.

### linear
Increases the timeout by `1ms` on every reconnect starting with `timeout` option. E.g. `timeout = 134`, then sequence is `134, 135, 136, 137, ...`.

### powerOf2
Takes `1ms` as a start point and multiplies by `2` on every reconnect. `1, 2, 4, 8, 16, ...`.

### random
Reconnect timeout is a random value in range `[0, timeout)`.
