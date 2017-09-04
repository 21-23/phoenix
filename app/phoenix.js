const createEventer = require('./eventer');

const loggerStub = {
    warn: () => {},
    log: () => {},
};

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

function createConnection(Client, uri, timeout, logger, callback) {
    connect(Client, uri, (socket) => {
        if (socket) {
            logger.log('Client created');
            return callback(null, socket);
        }

        logger.warn('Can not create a connection, retry...');
        const timerId = setTimeout(() => {
            createConnection(Client, uri, timeout, logger, callback);
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

function listenToClient(client, reborn, eventer, logger) {
    client.onclose = ({ code }) => {
        clearClient(client);
        eventer.emit(EVENTS.DISCONNECTED);

        if (code === CODES.STOP) {
            return logger.warn('Connection closed with STOP code; Do not reconnect');
        }

        logger.warn('Connection closed; Reborn...');
        reborn();
    };
    client.onerror = () => {
        logger.warn('Connection error; Reborn...');
        clearClient(client);
        eventer.emit(EVENTS.DISCONNECTED);
        reborn();
    };
    client.onmessage = (message) => {
        eventer.emit(EVENTS.MESSAGE, message);
    };
}

module.exports = function (Client, options) {
    if (!options || !options.uri || typeof Client !== 'function') {
        throw new Error('Invalid options; At least client and uri should be provided');
    }

    const timeout = options.timeout || 0;
    const eventer = createEventer();
    let logger = options.logger;
    let timer = null;
    let client = null;
    let state = STATES.DISCONNECTED;

    if (logger === null) {
        logger = loggerStub;
    } else if (!logger) {
        logger = console || loggerStub;
    }

    function reborn() {
        client = null;
        state = STATES.CONNECTING;
        createConnection(Client, options.uri, timeout, logger, (reconnectTimer, socket) => {
            if (reconnectTimer) {
                timer = reconnectTimer;
                return;
            }
            client = socket;
            listenToClient(client, reborn, eventer, logger);
            state = STATES.CONNECTED;
            eventer.emit(EVENTS.CONNECTED);
        });
    }

    reborn();

    const phoenix = {
        send: (message) => {
            if (!client) {
                if (state !== STATES.CONNECTING) {
                    logger.warn('No client; Reborn...');
                    reborn();
                } else {
                    logger.warn('No client; Resurrecting...');
                }

                return false;
            }

            client.send(message, (error) => {
                if (error) {
                    logger.log('Message send error; Reborn...');
                    clearClient(client);
                    eventer.emit(EVENTS.DISCONNECTED);
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

            eventer.removeAllListeners();
        },
        on: (eventName, listener) => {
            eventer.addListener(eventName, listener);

            return phoenix;
        },
        off: (eventName, listener) => {
            if (listener) {
                eventer.removeListener(eventName, listener);
            } else {
                eventer.removeAllListeners(eventName);
            }

            return phoenix;
        }
    };

    return phoenix;
};
