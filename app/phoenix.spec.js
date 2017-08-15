/* global describe, it, beforeEach, afterEach */
const assert = require('assert');

const sinon = require('sinon');

const createPhoenix = require('./phoenix');

function getConnectableSocket(attempts, ctorSpy, send, close, autoClose, autoError, autoMessage) {
    let attempt = 0;

    function ConnectableSocket(uri) {
        this.onopen = null;
        this.onerror = null;
        this.onclose = null;
        this.onmessage = null;

        if (typeof ctorSpy === 'function') {
            ctorSpy(uri);
        }

        this.send = send || ((message, callback) => {
            return callback();
        });
        this.close = close || (() => { });

        setTimeout(() => {
            if (attempt < attempts) {
                attempt += 1;
                this.onerror();
            } else {
                this.onopen();

                if (autoClose) {
                    setTimeout(() => {
                        if (typeof this.onclose === 'function') {
                            this.onclose({ code: autoClose.code });
                        }
                    }, autoClose.timeout);
                }
                if (autoError) {
                    setTimeout(() => {
                        if (typeof this.onerror === 'function') {
                            this.onerror(autoError.error);
                        }
                    }, autoError.timeout);
                }
                if (autoMessage) {
                    setTimeout(() => {
                        if (typeof this.onmessage === 'function') {
                            this.onmessage(autoMessage.message);
                        }
                    }, autoMessage.timeout);
                }
            }
        }, 10);
    }

    return ConnectableSocket;
}

describe('phoenix', () => {

    describe('instance creation', () => {
        it('should throw an error if options are not provided', () => {
            assert.throws(() => {
                createPhoenix(getConnectableSocket(0));
            });
        });
        it('should throw an error if uri is not provided', () => {
            assert.throws(() => {
                createPhoenix(getConnectableSocket(0), { });
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

    describe('destroy', () => {
        let clock;
        let phoenix;

        beforeEach(() => {
            clock = sinon.useFakeTimers(1);
        });

        afterEach(() => {
            clock.restore();
            clock = null;

            if (phoenix) {
                phoenix.destroy();
            }
        });

        it('should not fail if client is not created yet', () => {
            phoenix = createPhoenix(getConnectableSocket(Infinity), { uri: 'ws://valid.uri/', timeout: 100 });

            clock.tick(50);

            assert.doesNotThrow(() => {
                phoenix.destroy();
            });
        });

        it('should not fail if called multiple times', () => {
            phoenix = createPhoenix(getConnectableSocket(0), { uri: 'ws://valid.uri/', timeout: 10 });

            clock.tick(50);
            phoenix.destroy();

            assert.doesNotThrow(() => {
                phoenix.destroy();
            });
        });

        it('should close already opened connection', () => {
            const close = sinon.spy();
            phoenix = createPhoenix(getConnectableSocket(0, null, null, close), { uri: 'ws://valid.uri/', timeout: 10 });

            clock.tick(50);
            phoenix.destroy();

            assert.ok(close.called);
        });

        it('should stop re-connect procedure', () => {
            const ctor = sinon.spy();
            phoenix = createPhoenix(getConnectableSocket(Infinity, ctor), { uri: 'ws://valid.uri/', timeout: 10 });

            clock.tick(50);
            assert.ok(ctor.called);
            ctor.reset();

            phoenix.destroy();
            clock.tick(50);
            assert.ok(!ctor.called);
        });

        it('should remove listeners', () => {
            const onMessageSpy = sinon.spy();
            const onDisconnectedSpy = sinon.spy();
            phoenix = createPhoenix(getConnectableSocket(0, null, null, null, null, { timeout: 7, error: 'error' }, { timeout: 5, message: 'msg' }), { uri: 'ws://valid.uri/', timeout: 100 });

            phoenix.on('message', onMessageSpy);
            phoenix.on('disconnected', onDisconnectedSpy);

            clock.tick(13); // 10 ticks for connection

            phoenix.destroy();

            clock.tick(100); // let message and error come

            assert.ok(!onMessageSpy.called);
            assert.ok(!onDisconnectedSpy.called);
        });
    });

    describe('events', () => {
        describe('connected', () => {
            let clock;
            let phoenix;

            beforeEach(() => {
                clock = sinon.useFakeTimers(1);
            });

            afterEach(() => {
                clock.restore();
                clock = null;

                if (phoenix) {
                    phoenix.destroy();
                }
            });

            it('should be emitted after successfull connection', (done) => {
                phoenix = createPhoenix(getConnectableSocket(0), { uri: 'ws://valid.uri/' });

                phoenix.on('connected', () => {
                    assert.ok(true);
                    done();
                }).on('disconnected', () => {
                    assert.ok(false, 'Event "disconnected" should not be emitted for successful connection');
                });

                clock.tick(50);
            });

            it('should not be emitted if connection fails', (done) => {
                phoenix = createPhoenix(getConnectableSocket(1), { uri: 'ws://valid.uri/', timeout: 100 });

                phoenix.on('connected', () => {
                    assert.ok(false, 'Event "connected" should not be emitted for failed connection');
                });

                clock.tick(50);
                done();
            });

            it('should be emitted after successfull connection even of first attemp failed', (done) => {
                phoenix = createPhoenix(getConnectableSocket(1), { uri: 'ws://valid.uri/', timeout: 100 });

                phoenix.on('connected', () => {
                    assert.ok(true);
                    done();
                }).on('disconnected', () => {
                    assert.ok(false, 'Event "disconnected" should not be emitted for successful connection');
                });

                clock.tick(150);
            });
        });

        describe('disconnected', () => {
            let clock;
            let phoenix;

            beforeEach(() => {
                clock = sinon.useFakeTimers(1);
            });

            afterEach(() => {
                clock.restore();
                clock = null;

                if (phoenix) {
                    phoenix.destroy();
                }
            });

            it('should be emitted if there is an error in sending message', (done) => {
                phoenix = createPhoenix(getConnectableSocket(0, null, (msg, cb) => { cb('error'); }), { uri: 'ws://valid.uri/', timeout: 100 });

                phoenix.on('connected', () => {
                    phoenix.send('Custom message');
                }).on('disconnected', () => {
                    assert.ok(true);
                    done();
                });

                clock.tick(11);
            });

            it('should be emitted if socket is closed', (done) => {
                phoenix = createPhoenix(getConnectableSocket(0, null, null, null, { code: 4100, timeout: 10 }), { uri: 'ws://valid.uri/', timeout: 100 });

                phoenix.on('disconnected', () => {
                    assert.ok(true);
                    done();
                });

                clock.tick(21);
            });

            it('should be emitted in case of error', (done) => {
                phoenix = createPhoenix(getConnectableSocket(0, null, null, null, null, { error: 'error', timeout: 10 }), { uri: 'ws://valid.uri/', timeout: 100 });

                phoenix.on('disconnected', () => {
                    assert.ok(true);
                    done();
                });

                clock.tick(21);
            });
        });

        describe('message', () => {
            let clock;
            let phoenix;

            beforeEach(() => {
                clock = sinon.useFakeTimers(1);
            });

            afterEach(() => {
                clock.restore();
                clock = null;

                if (phoenix) {
                    phoenix.destroy();
                }
            });

            it('should be emitted as a message reaction', (done) => {
                phoenix = createPhoenix(getConnectableSocket(0, null, null, null, null, null, { message: 'msg', timeout: 10 }), { uri: 'ws://valid.uri/', timeout: 100 });

                phoenix.on('message', () => {
                    assert.ok(true);
                    done();
                });

                clock.tick(21);
            });
            it('should have a correct payload', (done) => {
                const message = 'test-msg';
                phoenix = createPhoenix(getConnectableSocket(0, null, null, null, null, null, { message, timeout: 10 }), { uri: 'ws://valid.uri/', timeout: 100 });

                phoenix.on('message', (msg) => {
                    assert.ok(true);
                    assert.equal(msg, message);
                    done();
                });

                clock.tick(21);
            });
        });
    });

    describe('reconnection', () => {
        let clock;
        let phoenix;

        beforeEach(() => {
            clock = sinon.useFakeTimers(1);
        });

        afterEach(() => {
            clock.restore();
            clock = null;

            if (phoenix) {
                phoenix.destroy();
            }
        });

        it('should be interrupted by STOP code', () => {
            const onConnectedSpy = sinon.spy();
            phoenix = createPhoenix(getConnectableSocket(0, null, null, null, { code: 4500, timeout: 10 }), { uri: 'ws://valid.uri/', timeout: 10 });

            phoenix.on('connected', onConnectedSpy);

            clock.tick(50);

            assert.equal(onConnectedSpy.callCount, 1);
        });
    });

});
