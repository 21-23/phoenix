/* global describe, it */
const assert = require('assert');

const createConstStrategy = require('./const');

describe('strategy: const', () => {
    it('should return function', () => {
        assert.equal(typeof createConstStrategy(), 'function');
    });

    it('should always return the same const value (base)', () => {
        const base = 400;
        const strategy = createConstStrategy(base);

        assert.equal(strategy(), base);
        assert.equal(strategy(), base);
        assert.equal(strategy(), base);
    });
});
