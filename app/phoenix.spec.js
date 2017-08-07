/* global describe, it, beforeEach, afterEach */
const assert = require('assert');

const sinon = require('sinon');

const createPhoenix = require('./phoenix');

function getConnectableSocket() {
    return function ConnectableSocket(uri) {
        this.onopen = null;
        this.onerror = null;
        this.onclose = null;
        this.onmessage = null;

        this.send = (message, callback) => {
            return callback();
        };
        this.close = () => { };

        setTimeout(() => {
            if (typeof this.onopen === 'function') {
                this.onopen();
            }
        }, 10);
    };
}

describe('phoenix', () => {

    describe('instance creation', () => {
        it('should throw an error if options are not provided', () => {
            assert.throws(() => {
                createPhoenix(getConnectableSocket());
            });
        });
        it('should throw an error if uri is not provided', () => {
            assert.throws(() => {
                createPhoenix(getConnectableSocket(), { });
            });
        });
        it('should throw an error if Client is not a function', () => {
            assert.throws(() => {
                createPhoenix(null, { uri: 'ws://valid.uri/' });
            });
            assert.throws(() => {
                createPhoenix(1, { uri: 'ws://valid.uri/' });
            });
            assert.throws(() => {
                createPhoenix('client', { uri: 'ws://valid.uri/' });
            });
        });
    });

    describe('events', () => {
        describe('connected', () => {
            let clock;

            beforeEach(() => {
                clock = sinon.useFakeTimers(1);
            });

            afterEach(() => {
                clock.restore();
                clock = null;
            });

            it('should be emitted after successfull connection', (done) => {
                const phoenix = createPhoenix(getConnectableSocket(), { uri: 'ws://valid.uri/' });

                phoenix.on('connected', () => {
                    assert.ok(true);
                    done();
                }).on('disconnected', () => {
                    assert.ok(false, 'Event "disconnected" should not be emitted for successful connection');
                });

                clock.tick(50);
            });
        });
    });

});
