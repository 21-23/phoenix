/* global describe, it */
const assert = require('assert');

const createPowerOf2Strategy = require('./powerOf2');

describe('strategy: powerOf2', () => {
    it('should return function', () => {
        assert.equal(typeof createPowerOf2Strategy(), 'function');
    });

    it('should return power of 2 sequence', () => {
        const strategy = createPowerOf2Strategy();

        assert.equal(strategy(), 1);
        assert.equal(strategy(), 2);
        assert.equal(strategy(), 4);
        assert.equal(strategy(), 8);
        assert.equal(strategy(), 16);
        assert.equal(strategy(), 32);
        assert.equal(strategy(), 64);
        assert.equal(strategy(), 128);
        assert.equal(strategy(), 256);
    });
});
