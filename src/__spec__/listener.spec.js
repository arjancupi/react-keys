import {
  keysListeners,
  fired,
  block,
  _init,
  cb,
  cbRelease,
  addListener,
  removeListener,
  globalStore,
} from '../listener';
import { NAME } from '../constants';
import blocks from '../blocks';
import * as actions from '../redux/actions';

import sinon from 'sinon';

describe('listener.js', () => {
  let clock;

  beforeEach(function() {
    clock = sinon.useFakeTimers();
    keysListeners.length = 0;
  });

  afterEach(function() {
    clock.restore();
    keysListeners.length = 0;
  });

  it('globalStore should be an object', () => {
    globalStore.should.be.instanceOf(Object);
  });

  it('should cbRelease call all listeners cb', () => {
    const mySpy = sinon.spy();
    const keyCode = 'keyCode';
    const internCb = {
      id: 0,
      callback: mySpy,
      context: { props: { id: '1' } },
    };
    keysListeners.push(internCb);
    cbRelease(keyCode);
    fired.should.equal(false);
  });

  it('should cb call all listeners cb', sinon.test(function() {
    const mySpy = this.spy();
    const updateBinderStateSpy = this.spy(actions, 'updatePressStatus');
    const keyCode = 'keyCode';
    const internCb = {
      id: 0,
      callback: mySpy,
      context: { props: { id: '1' } },
    };
    keysListeners.push(internCb);
    cb(keyCode);
    this.clock.tick(1000);
    fired.should.equal(true);
    mySpy.should.have.been.calledOnce;
    mySpy.should.have.been.calledWith(keyCode);
    updateBinderStateSpy.should.have.been.calledOnce;
    updateBinderStateSpy.should.have.been.calledWith(true);
  }));

  it('should cb and cbRelease call all listeners cb', sinon.test(function() {
    const mySpy = this.spy();
    this.stub(globalStore, 'getState').returns({
      [NAME]: { 'PRESS': { press: false } }
    });
    const keyCode = 'keyCode';
    const internCb = {
      id: 0,
      callback: mySpy,
      context: { props: { id: '1' } },
    };
    keysListeners.push(internCb);
    cb(keyCode);
    cbRelease(keyCode);
    this.clock.tick(1000);
    fired.should.equal(false);
  }));

  it('_init should listen on keydown event by default', sinon.test(function() {
    this.mock(document).expects('addEventListener')
      .twice();
    _init();
  }));

  it('_init should execute callback if one is passed', sinon.test(function() {
    this.mock(document).expects('addEventListener').never();
    const callback = sinon.spy();
    _init({
      bindkeys: callback,
    });
    callback.should.have.been.calledOnce;
    callback.should.have.been.calledWith(cb);
  }));

  it('addListener should add callback with context to keysListener array', () => {
    keysListeners.should.be.empty;
    const callback = sinon.spy();
    const listenerId = addListener(callback, 'CONTEXT');
    keysListeners.should.have.lengthOf(1);
    keysListeners[0].id.should.equals(listenerId);
    keysListeners[0].callback.should.equals(callback);
    keysListeners[0].context.should.equals('CONTEXT');
  });

  it('should removeListener remove a callback through the id', () => {
    keysListeners.should.be.empty;
    const callback = sinon.spy();
    const listenerId = addListener(callback, 'CONTEXT');
    keysListeners.should.have.lengthOf(1);
    removeListener(listenerId);
    keysListeners.should.be.empty;
  });

  it('should not call any callback when block is true', sinon.test(function() {
    const callback = sinon.spy();
    this.stub(globalStore, 'getState').returns({
      [NAME]: { 'PRESS': { press: false } }
    });
    addListener(callback, 'CONTEXT');
    cb('keyCode');
    block.should.be.true;
    cb('keyCode'); // NO MORE CALL
    callback.should.have.been.calledOnce;
    cbRelease(); // SET BLOCK TO FALSE
  }));

  it('should cbRelease set block to false', sinon.test(function() {
    this.stub(globalStore, 'getState').returns({
      [NAME]: { 'PRESS': { press: false } }
    });
    cb('keyCode');
    block.should.be.true;
    cbRelease();
    block.should.be.false;
  }));

  it('should call callback when longPress', sinon.test(function() {
    const callback = sinon.spy();
    this.stub(globalStore, 'getState').returns({
      [NAME]: { 'PRESS': { press: true } }
    });
    addListener(callback, 'CONTEXT');
    cb('keyCode');
    cb('keyCode');
    callback.should.have.been.calledTwice;
    cbRelease(); // SET BLOCK TO FALSE
  }));

  it('should block callback when blocks has a key', sinon.test(function() {
    const callback = sinon.spy();
    addListener(callback, 'CONTEXT');
    this.stub(blocks, 'isBlocked').returns(true);
    cb(31);
    callback.should.have.callCount(0);
  }));

  it('should block callback when blocks has a key', sinon.test(function() {
    const callback = sinon.spy();
    addListener(callback, 'CONTEXT');
    this.stub(blocks, 'isBlocked').returns(false);
    cb(31);
    callback.should.have.been.calledOnce;
    cbRelease(); // SET BLOCK TO FALSE
  }));

});
