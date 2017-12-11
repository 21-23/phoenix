module.exports = function createConstStrategy(base) {
    return function constStrategy() {
        return base;
    };
};
