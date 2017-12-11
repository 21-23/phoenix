/* global describe, it */
const assert = require('assert');

const createLinearStrategy = require('./linear');

describe('strategy: linear', () => {
    it('should return function', () => {
        assert.equal(typeof createLinearStrategy(), 'function');
    });

    it('should return linear sequence', () => {
        const strategy = createLinearStrategy(0);

        assert.equal(strategy(), 0);
        assert.equal(strategy(), 1);
        assert.equal(strategy(), 2);
        assert.equal(strategy(), 3);
        assert.equal(strategy(), 4);
        assert.equal(strategy(), 5);
        assert.equal(strategy(), 6);
        assert.equal(strategy(), 7);
        assert.equal(strategy(), 8);
    });

    it('should start with given base', () => {
        const strategy = createLinearStrategy(139);

        assert.equal(strategy(), 139);
        assert.equal(strategy(), 140);
        assert.equal(strategy(), 141);
        assert.equal(strategy(), 142);
        assert.equal(strategy(), 143);
    });
});
