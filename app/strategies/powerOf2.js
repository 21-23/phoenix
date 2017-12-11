module.exports = function createPowerOf2Strategy(base) {
    // base is ignored here
    let value = 0.5;

    return function powerOf2Strategy() {
        value *= 2;

        return value;
    };
};
