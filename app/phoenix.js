const EventEmitter = require('events');

function onConnectFail(socket, callback) {
    socket.onopen = null;
    socket.onerror = null;
    callback(null);
}

function connect(Client, uri, timeout, callback) {
    let socket = new Client(uri);

    const timeoutId = setTimeout(() => {
        onConnectFail(socket, callback);
        socket = null;
    }, timeout);

    socket.onopen = () => {
        clearTimeout(timeoutId);
        callback(socket);
    };
    socket.onerror = () => {
        clearTimeout(timeoutId);
        onConnectFail(socket, callback);
        socket = null;
    };
}

function createConnection(Client, uri, timeout, callback) {
    connect(Client, uri, timeout, (socket) => {
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
}

function listenToClient(client, emitter, reborn) {
    client.onclose = () => {
        console.warn('[phoenix]', 'Connection closed; Reborn...');
        clearClient(client);
        emitter.emit('disconnected');
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

exports.serverPhoenix = function serverPhoenix(Client, options) {
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
