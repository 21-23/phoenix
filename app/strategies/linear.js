module.exports = function createLinearStrategy(base) {
    // base is ignored here
    let value = base - 1;

    return function linearStrategy() {
        value += 1;

        return value;
    };
};
