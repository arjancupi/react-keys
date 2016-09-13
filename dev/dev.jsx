import 'react-addons-perf';
import React from 'react';
import ReactDOM from 'react-dom';
import { compose } from 'recompose';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import { connect, Provider } from 'react-redux';
import {
  Binder,
  Keys,
  StrapeBinder,
  Carousel,
  keysInit,
  keysReducer,
  activeKeyBinder
} from '../src';

const logger = store => next => action => {
  console.group(action.type);
  console.info('dispatching', action);
  const result = next(action);
  console.info('next state', store.getState());
  console.groupEnd(action.type);
  return result;
};

const store = createStore(combineReducers({
  '@@keys': keysReducer,
}), compose(applyMiddleware(), window.devToolsExtension && window.devToolsExtension()));

keysInit({ store: store });

const PureMosaic = () => {
  return (
    <Carousel id="carousel" active={true} size={3} elWidth={50} className="carousel" speed={60}
              debounce={65}>
      <div id="1" className="thumb">1</div>
      <div id="2" className="thumb">2</div>
      <div id="3" className="thumb">3</div>
      <div id="4" className="thumb">4</div>
      <div id="5" className="thumb">5</div>
      <div id="6" className="thumb">6</div>
      <div id="7" className="thumb">7</div>
      <div id="8" className="thumb">8</div>
      <div id="9" className="thumb">9</div>
      <div id="10" className="thumb">10</div>
      <div id="11" className="thumb">11</div>
      <div id="12" className="thumb">12</div>
      <div id="13" className="thumb">13</div>
      <div id="14" className="thumb">14</div>
      <div id="15" className="thumb">15</div>
    </Carousel>
  );
};

const Mosaic = connect(state => {
  return {
    selectedId: state['@@keys'].current.selectedId,
  };
})(PureMosaic);

ReactDOM.render(<Provider store={store}>
  <PureMosaic/>
</Provider>, document.getElementById('body'));

activeKeyBinder('strape-1');

