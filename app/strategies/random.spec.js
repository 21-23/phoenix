/* global describe, it */
const assert = require('assert');

const createRandomStrategy = require('./random');

describe('strategy: random', () => {
    it('should return function', () => {
        assert.equal(typeof createRandomStrategy(), 'function');
    });

    it('should always return different value', () => {
        const base = 400;
        const strategy = createRandomStrategy(base);

        const value1 = strategy();
        const value2 = strategy();
        const value3 = strategy();

        assert.notEqual(value1, value2);
        assert.notEqual(value1, value3);
        assert.notEqual(value3, value2);
    });

    it('should generate value between 0 and base', () => {
        const base = 250;
        const strategy = createRandomStrategy(base);

        assert.ok(strategy() > 0);
        assert.ok(strategy() < base);
    });
});
