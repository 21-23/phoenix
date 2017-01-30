const WebSocketClient = require('uws'); // eslint-disable-line import/no-extraneous-dependencies

const createPhoenix = require('../app/phoenix');

const phoenix = createPhoenix(WebSocketClient, { uri: 'ws://localhost:8090/', timeout: 3000 });

phoenix.on('connected', () => {
    console.log('phoenix connected');
}).on('disconnected', () => {
    console.log('phoenix disconnected');
}).on('message', (message) => {
    console.log('phoenix message', message);
});

setInterval(() => {
    phoenix.send('Message from client');
}, 100);
