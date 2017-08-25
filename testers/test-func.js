const WebSocketClient = require('uws'); // eslint-disable-line import/no-extraneous-dependencies

const createPhoenix = require('../app/phoenix');

const phoenix = createPhoenix(WebSocketClient, {
    uri: 'wss://echo.websocket.org',
    timeout: 3000,
    logger: {
        warn: console.warn.bind(console, '[test-func]'),
        log: console.log.bind(console, '[test-func]')
    }
});

phoenix.on('connected', () => {
    console.log('phoenix connected');
}).on('disconnected', () => {
    console.log('phoenix disconnected');
}).on('message', (message) => {
    console.log('phoenix message', message);
}).on('message', onMessage);

setTimeout(() => {
    console.log('Remove onMessage');
    phoenix.off('message', onMessage);
}, 5000);
setTimeout(() => {
    console.log('Remove all message listeners');
    phoenix.off('message');
}, 8000);
setTimeout(() => {
    console.log('Remove all listeners');
    phoenix.off();
}, 10000);

function onMessage(message) {
    console.log('onMessage', message);
}

setInterval(() => {
    phoenix.send('Message from client');
}, 1000);
