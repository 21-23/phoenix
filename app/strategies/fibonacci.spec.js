/* global describe, it */
const assert = require('assert');

const createFibonacciStrategy = require('./fibonacci');

describe('strategy: fibonacci', () => {
    it('should return function', () => {
        assert.equal(typeof createFibonacciStrategy(), 'function');
    });

    it('should return fibonacci sequence', () => {
        const strategy = createFibonacciStrategy();

        assert.equal(strategy(), 0);
        assert.equal(strategy(), 1);
        assert.equal(strategy(), 1);
        assert.equal(strategy(), 2);
        assert.equal(strategy(), 3);
        assert.equal(strategy(), 5);
        assert.equal(strategy(), 8);
        assert.equal(strategy(), 13);
        assert.equal(strategy(), 21);
    });
});
