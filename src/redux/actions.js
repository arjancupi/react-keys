import { globalStore } from '../listener';
import { findIdByStrategy } from '../engines/strategy';
import { boundsMargin, correctBoundsMargin } from '../engines/bounds';
import { calculateNewState } from '../engines/helpers';
import { NAME, EXIT_STRATEGY_MEMORY, CAROUSEL_TYPE } from '../constants';
import { ensureDispatch, ensureMountedBinder, isUnmountedBinder } from '../ensure';
import { execCb, enterTo } from '../funcHandler';

export const ACTIVATE_BINDER = [NAME, '/ACTIVATE_BINDER'].join('');
export const ADD_BINDER_TO_STORE = [NAME, '/ADD_BINDER_TO_STORE'].join('');
export const UPDATE_BINDER_SELECTED_KEY = [NAME, '/UPDATE_BINDER_SELECTED_KEY'].join('');
export const UPDATE_BINDER_STATE = [NAME, '/UPDATE_BINDER_STATE'].join('');
export const UPDATE_CURRENT = [NAME, '/UPDATE_CURRENT'].join('');
export const UPDATE_PRESS_STATUS = [NAME, '/UPDATE_PRESS_STATUS'].join('');
export const RESET_BINDER = [NAME, '/RESET_BINDER'].join('');

export function addCarouselToStore(props, type) {
  ensureDispatch();
  const {
    id,
    active,
    circular,
    size,
    index,
    elements,
  } = props;
  if (!isUnmountedBinder(id) && props.active) {
    _activeBinder(id, index);
    return;
  }
  globalStore.dispatch({
    type: ADD_BINDER_TO_STORE,
    newBinder: {
      [id]: {
        id,
        type,
        active,
        circular,
        size,
        index,
        elements: elements || [],
      }
    },
  });
}

export function addBinderToStore(props, type) {
  ensureDispatch();
  const state = globalStore.getState()[NAME];
  if (!isUnmountedBinder(props.id) && props.active) {
    _activeBinder(props.id);
    return;
  }
  const {
    id,
    active,
    selector,
    gap,
    boundedGap,
    topGap,
    rightGap,
    elements,
    leftGap,
    downGap,
    enterStrategy,
    position,
  } = props;
  globalStore.dispatch({
    type: ADD_BINDER_TO_STORE,
    inactiveBinders: active ? desactivateBinders(state, id) : {},
    newBinder: {
      [id]: {
        id,
        active,
        type,
        selector,
        gap,
        boundedGap,
        topGap,
        rightGap,
        leftGap,
        downGap,
        enterStrategy,
        position,
        elements: elements || [],
        prevEl: null,
        prevDir: null,
        nextEl: null,
        hasMoved: false,
        marginLeft: 0,
        marginTop: 0
      }
    },
  });
}

export function _activeBinder(binderId, nextElId, dir) {
  ensureDispatch();
  ensureMountedBinder(binderId);
  const state = globalStore.getState()[NAME];
  const toActivate = state[binderId];
  const selectedId = findIdByStrategy(state, binderId, nextElId);
  globalStore.dispatch({
    type: ACTIVATE_BINDER,
    binderId,
    inactiveBinders: desactivateBinders(state, binderId),
  });
  if (toActivate && toActivate.type === CAROUSEL_TYPE) {
    _resetCarousel(binderId, selectedId, dir);
  } else {
    _resetBinder(binderId, selectedId, dir);
  }
}

export function _resetCarousel(binderId, wishedId) {
  ensureDispatch();
  ensureMountedBinder(binderId);
  const originalState = globalStore.getState()[NAME][binderId];
  const { elements, selectedId } = originalState;
  if (elements.length === 0) return;
  const newSelectedId = wishedId || elements[0].id;
  const state = {
    selectedId: newSelectedId,
    hasMoved: true,
    prevEl: elements.find(e => e.id === selectedId),
    nextEl: elements.find(e => e.id === newSelectedId),
    prevDir: null
  };
  _updateBinder(binderId, state);
}

export function _resetBinder(binderId, wishedId) {
  ensureDispatch();
  ensureMountedBinder(binderId);
  const originalState = globalStore.getState()[NAME][binderId];
  const { elements, selectedId } = originalState;
  const newSelectedId = wishedId || elements[0].id;
  if (elements.length === 0) return;
  const margin = boundsMargin(newSelectedId, originalState);
  const state = {
    selectedId: newSelectedId,
    hasMoved: true,
    prevEl: elements.find(e => e.id === selectedId),
    nextEl: elements.find(e => e.id === newSelectedId),
    prevDir: null,
    marginLeft: margin.marginLeft,
    marginTop: margin.marginTop,
  };
  _updateBinder(binderId, state);
}

export function _updateBinder(binderId, state) {
  ensureDispatch();
  ensureMountedBinder(binderId);
  const { active } = globalStore.getState()[NAME][binderId];
  globalStore.dispatch({
    type: UPDATE_BINDER_STATE,
    binderId,
    state,
  });
  if (active) {
    globalStore.dispatch({
      type: UPDATE_CURRENT,
      binderId,
      selectedId: state.selectedId,
    });
  }
}

export function updateBinderSelectedId(binderId, selectedId) {
  ensureDispatch();
  ensureMountedBinder(binderId);
  const margin = boundsMargin(selectedId, globalStore.getState()[NAME][binderId]);
  globalStore.dispatch({
    type: UPDATE_BINDER_SELECTED_KEY,
    binderId,
    selectedId,
    marginLeft: margin.marginLeft,
    marginTop: margin.marginTop,
  });
}

export function updatePosition(binderId, selectedId) {
  ensureDispatch();
  ensureMountedBinder(binderId);
  resetFlipFlop(binderId);
  const margin = correctBoundsMargin(selectedId, globalStore.getState()[NAME][binderId]);
  globalStore.dispatch({
    type: UPDATE_BINDER_SELECTED_KEY,
    binderId,
    selectedId,
    marginLeft: margin.marginLeft,
    marginTop: margin.marginTop,
  });
}

export function desactivateBinders(binders, binderId) {
  let updatedBinders = {};
  Object.keys(binders).map(key => {
    if (key !== 'current' && key !== 'PRESS' && key !== binderId && binders[key].type !== 'keys')
      updatedBinders[key] = { ...binders[key], active: false };
  });
  return updatedBinders;
}

export function updatePressStatus(press, keyCode = null) {
  ensureDispatch();
  if (globalStore.getState()[NAME]['PRESS'].press !== press) {
    globalStore.dispatch({
      type: UPDATE_PRESS_STATUS,
      press,
      keyCode,
    });
  }
}

export function determineNewState(binderId, dir, cb, exitCb, _this) {
  ensureDispatch();
  ensureMountedBinder(binderId);
  const { nextEl, prevEl, prevDir, elements } = globalStore.getState()[NAME][binderId];
  const newState = calculateNewState(dir, nextEl, prevEl, prevDir, elements);
  globalStore.dispatch({
    type: UPDATE_BINDER_STATE,
    binderId,
    state: newState,
  });
  if (newState.hasMoved) {
    updateBinderSelectedId(binderId, newState.nextEl.id, dir);
    execCb(cb, nextEl, _this);
  } else {
    resetFlipFlop(binderId);
    enterTo(exitCb);
  }
}

export function resetFlipFlop(binderId) {
  ensureDispatch();
  ensureMountedBinder(binderId);
  const { enterStrategy } = globalStore.getState()[NAME][binderId];
  if (enterStrategy !== EXIT_STRATEGY_MEMORY) {
    globalStore.dispatch({
      type: UPDATE_BINDER_STATE,
      binderId,
      state: { prevDir: null },
    });
  }
}
