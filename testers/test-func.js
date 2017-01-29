const WebSocketClient = require('uws'); // eslint-disable-line import/no-extraneous-dependencies

const { serverPhoenix } = require('../app/phoenix');

// --------------------- test server ---------------------
const WebSocketServer = require('uws').Server; // eslint-disable-line import/no-extraneous-dependencies

let wss = new WebSocketServer({ port: 8090 });

wss.on('connection', () => {
    console.log('ws client connected');
});

setInterval(() => {
    wss.close();
    setTimeout(() => {
        wss = new WebSocketServer({ port: 8090 });
        wss.on('connection', () => {
            console.log('ws client connected');
        });
    }, 1000);
}, 5000);


const phoenix = serverPhoenix(WebSocketClient, { uri: 'ws://localhost:8090/', timeout: 3000 });

phoenix.once('connected', () => {
    phoenix.send('message');
    console.log('phoenix once connected');
}).on('connected', () => {
    console.log('phoenix connected');
}).on('disconnected', () => {
    console.log('phoenix disconnected');
}).on('message', () => {
    console.log('phoenix message');
});
