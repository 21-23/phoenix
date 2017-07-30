const WebSocketServer = require('uws').Server; // eslint-disable-line import/no-extraneous-dependencies

const wss = new WebSocketServer({ port: 8090 });

wss.on('connection', (ws) => {
    console.log('ws client connected');

    ws.on('message', (message) => { console.log('message from client', message); });

    function sendRandomMessage() {
        const now = Date.now();
        console.log('send', now);
        ws.send('message from server::' + now);
        setTimeout(sendRandomMessage, Math.random() * 3000);
    }

    setTimeout(sendRandomMessage, Math.random() * 3000);
});
