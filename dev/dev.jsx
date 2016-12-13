import React from 'react';
import ReactDOM from 'react-dom';
import {createStore, applyMiddleware, combineReducers} from 'redux';
import {connect, Provider} from 'react-redux';
import {
  Binder,
  keysInit,
  keysReducer,
  activeBinder,
  keysSelector,
  Keys,
} from '../src';

function reducer(state = {elements: ['1', '2', '3', '4', '5', '6', '7', '8', '9']}, action) {
  switch (action.type) {
    case 'LOOL':
      const n = state.elements;
      n.unshift(action.number);
      return {...state, elements: n};
    default:
      return state;
  }
}

//setTimeout(() => store.dispatch({type: 'LOOL', number: '11'}), 1000);
//setTimeout(() => store.dispatch({type: 'LOOL', number: '12'}), 1500);
//setTimeout(() => store.dispatch({type: 'LOOL', number: '13'}), 2000);
//setTimeout(() => store.dispatch({type: 'LOOL', number: '14'}), 2500);
//setTimeout(() => store.dispatch({type: 'LOOL', number: '15'}), 3000);
//setTimeout(() => store.dispatch({type: 'LOOL', number: '16'}), 1500);
//setTimeout(() => store.dispatch({type: 'LOOL', number: '17'}), 1600);

const store = createStore(combineReducers({
  '@@keys': keysReducer,
  'LOL': reducer,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());

keysInit({store: store});


const Card = ({id, active}) => {
  const style = active ? 'selected' : '';
  return (
    <li id={id} className={style}>#{id}</li>
  );
};

const PureMosaic = ({binder1, lool}) => {
  const {selectedId, active, marginTop, marginLeft} = binder1;
  return (
    <div>
      <Binder id="binder1"
              filter="disabled"
              gap={80}
              wrapper="#myWrapper"
              enterStrategy="memory">
        <div id="myWrapper" style={{
          width: '200px',
          height: '50px',
          overflow: 'hidden'
        }}>
          <ul style={{marginLeft}}>
            {lool.elements.map(el => <Card key={el} id={el} active={selectedId === el}/>)}
          </ul>
        </div>
      </Binder>
    </div>
  );
};

const Mosaic = connect((state) => {
  return {
    binder1: keysSelector('binder1')(),
    lool: state['LOL'],
  };
})(PureMosaic);

ReactDOM.render(
  <Provider store={store}>
    <Mosaic/>
  </Provider>
  , document.getElementById('body'));
