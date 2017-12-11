module.exports = function createRandomStrategy(base) {
    return function randomStrategy() {
        return Math.trunc(Math.random() * base);
    };
};
