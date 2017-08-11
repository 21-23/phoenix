const events = new Map();

const CODES = {
    STOP: 4500
};
const STATES = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
};
const EVENTS = {
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    MESSAGE: 'message',
};

// emit is far not generic as there's no need to be generic
// it should be fast and stable
function emit(eventName, message) {
    const handlers = events.get(eventName);

    if (!handlers) {
        return;
    }

    handlers.forEach((handler) => {
        handler(message);
    });
}

function removeAllListeners(eventName) {
    if (!eventName) {
        events.clear();
    }

    events.delete(eventName);
}

function removeListener(eventName, handler) {
    const handlers = events.get(eventName);

    if (!handlers) {
        return;
    }

    handlers.delete(handler);
}

function addListener(eventName, handler) {
    let handlers = events.get(eventName);

    if (!handlers) {
        events.set(eventName, handlers = new Set());
    }

    handlers.add(handler);
}

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
            return callback(null, socket);
        }

        console.warn('[phoenix]', 'Can not create a connection, retry...');
        const timerId = setTimeout(() => {
            createConnection(Client, uri, timeout, callback);
        }, timeout);
        callback(timerId);
    });
}

function clearClient(client) {
    client.onclose = null;
    client.onerror = null;
    client.onmessage = null;
    client.close();
}

function listenToClient(client, reborn) {
    client.onclose = ({ code }) => {
        clearClient(client);
        emit(EVENTS.DISCONNECTED);

        if (code === CODES.STOP) {
            return console.warn('[phoenix]', 'Connection closed with STOP code; Do not reconnect');
        }

        console.warn('[phoenix]', 'Connection closed; Reborn...');
        reborn();
    };
    client.onerror = () => {
        console.warn('[phoenix]', 'Connection error; Reborn...');
        clearClient(client);
        emit(EVENTS.DISCONNECTED);
        reborn();
    };
    client.onmessage = (message) => {
        emit(EVENTS.MESSAGE, message);
    };
}

module.exports = function (Client, options) {
    if (!options || !options.uri || typeof Client !== 'function') {
        throw new Error('Invalid options; At least client and uri should be provided');
    }

    const timeout = options.timeout || 0;
    let timer = null;
    let client = null;
    let state = STATES.DISCONNECTED;

    function reborn() {
        client = null;
        state = STATES.CONNECTING;
        createConnection(Client, options.uri, timeout, (reconnectTimer, socket) => {
            if (reconnectTimer) {
                timer = reconnectTimer;
                return;
            }
            client = socket;
            listenToClient(client, reborn);
            state = STATES.CONNECTED;
            emit(EVENTS.CONNECTED);
        });
    }

    reborn();

    const phoenix = {
        send: (message) => {
            if (!client) {
                if (state !== STATES.CONNECTING) {
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
                    emit(EVENTS.DISCONNECTED);
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
            if (timer) {
                clearTimeout(timer);
            }

            removeAllListeners();
        },
        on: (eventName, listener) => {
            addListener(eventName, listener);

            return phoenix;
        },
        off: (eventName, listener) => {
            if (listener) {
                removeListener(eventName, listener);
            } else {
                removeAllListeners(eventName);
            }

            return phoenix;
        }
    };

    return phoenix;
};
