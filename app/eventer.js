// emit is far not generic as there's no need to be generic
// it should be fast and stable
function emit(events, eventName, message) {
    const handlers = events.get(eventName);

    if (!handlers) {
        return;
    }

    handlers.forEach((handler) => {
        handler(message);
    });
}

function removeAllListeners(events, eventName) {
    if (!eventName) {
        events.clear();
    }

    events.delete(eventName);
}

function removeListener(events, eventName, handler) {
    const handlers = events.get(eventName);

    if (!handlers) {
        return;
    }

    handlers.delete(handler);
}

function addListener(events, eventName, handler) {
    let handlers = events.get(eventName);

    if (!handlers) {
        events.set(eventName, handlers = new Set());
    }

    handlers.add(handler);
}

module.exports = function () {
    const events = new Map();

    return {
        emit: emit.bind(null, events),
        removeAllListeners: removeAllListeners.bind(null, events),
        removeListener: removeListener.bind(null, events),
        addListener: addListener.bind(null, events),
    };
};
