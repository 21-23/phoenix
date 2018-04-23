module.exports = function createFibonacciStrategy(base) {
    // base is ignored here
    let left = 0;
    let right = 1;
    let n = -1;

    return function fibonacciStrategy() {
        n += 1;

        if (n === 0) {
            return left;
        }
        if (n === 1) {
            return right;
        }

        [left, right] = [right, left + right];

        return right;
    };
};
