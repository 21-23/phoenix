module.exports = function createLinearStrategy(base) {
    let value = base - 1;

    return function linearStrategy() {
        value += 1;

        return value;
    };
};
