// TODO: think about EventEmitter as a dependency for better in-browser usage
const EventEmitter = require('events');

const CODES = {
    STOP: 4500
};

function onConnectFail(socket) {
    socket.onopen = null;
    socket.onerror = null;
}

function connect(Client, uri, callback) {
    let socket = new Client(uri);

    socket.onopen = () => {
        callback(socket);
    };
    socket.onerror = () => {
        onConnectFail(socket);
        socket = null;
        callback(socket);
    };
}

function createConnection(Client, uri, timeout, callback) {
    connect(Client, uri, (socket) => {
        if (socket) {
            console.log('[phoenix]', 'Client created');
            return callback(socket);
        }

        console.warn('[phoenix]', 'Can not create a connection, retry...');
        setTimeout(() => {
            createConnection(Client, uri, timeout, callback);
        }, timeout);
    });
}

function clearClient(client) {
    client.onclose = null;
    client.onerror = null;
    client.onmessage = null;
    client.close();
}

function listenToClient(client, emitter, reborn) {
    client.onclose = ({ code }) => {
        clearClient(client);
        emitter.emit('disconnected');

        if (code === CODES.STOP) {
            return console.warn('[phoenix]', 'Connection closed with STOP code; Do not reconnect');
        }

        console.warn('[phoenix]', 'Connection closed; Reborn...');
        reborn();
    };
    client.onerror = () => {
        console.warn('[phoenix]', 'Connection error; Reborn...');
        clearClient(client);
        emitter.emit('disconnected');
        reborn();
    };
    client.onmessage = (message) => {
        emitter.emit('message', message);
    };
}

module.exports = function (Client, options) {
    if (!options || !options.uri || typeof Client !== 'function') {
        throw new Error('Invalid options; At least client and uri should be provided');
    }

    const timeout = options.timeout || 0;
    let emitter = new EventEmitter();
    let client = null;
    let state = 'disconnected';

    function reborn() {
        client = null;
        state = 'connecting';
        createConnection(Client, options.uri, timeout, (socket) => {
            client = socket;
            listenToClient(client, emitter, reborn);
            state = 'connected';
            emitter.emit('connected');
        });
    }

    reborn();

    const phoenix = {
        send: (message) => {
            if (!client) {
                if (state !== 'connecting') {
                    console.warn('[phoenix]', 'No client; Reborn...');
                    reborn();
                } else {
                    console.warn('[phoenix]', 'No client; Resurrecting...');
                }

                return false;
            }

            client.send(message, (error) => {
                if (error) {
                    console.log('[phoenix]', 'Message send error; Reborn...');
                    clearClient(client);
                    emitter.emit('disconnected');
                    reborn();
                }
            });

            return true;
        },
        destroy: () => {
            if (client) {
                clearClient(client);
                client = null;
            }
            if (emitter) {
                emitter.removeAllListeners();
                emitter = null;
            }
        },
        on: (eventName, listener) => {
            emitter.addListener(eventName, listener);

            return phoenix;
        },
        off: (eventName, listener) => {
            if (listener) {
                emitter.removeListener(eventName, listener);
            } else {
                emitter.removeAllListeners(eventName);
            }

            return phoenix;
        }
    };

    return phoenix;
};
