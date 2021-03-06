/* eslint no-unused-vars:0 */
import React, { Component, PropTypes } from 'react';
import { build, getNext, getPrev } from '../engines/carousel';
import { addListener, removeListener, userConfig } from '../listener';
import { isBlocked, block } from '../clock';
import { isActive } from '../isActive';
import { execCb } from '../funcHandler';
import { addCarouselToStore, _updateBinder } from '../redux/actions';
import { CAROUSEL_TYPE } from '../constants';
import { hasDiff } from '../engines/helpers';

class Carousel extends Component {

  static get propTypes() {
    return {
      children: React.PropTypes.oneOfType([
        React.PropTypes.object,
        React.PropTypes.array,
      ]),
      id: PropTypes.string.isRequired,
      active: PropTypes.bool,
      index: PropTypes.number,
      size: PropTypes.number,
      speed: PropTypes.number,
      debounce: PropTypes.number,
      elWidth: PropTypes.number,
      circular: PropTypes.bool,
      className: PropTypes.string,
      childrenClassName: PropTypes.string,
      onChange: PropTypes.func,
      onDownExit: PropTypes.func,
      onUpExit: PropTypes.func,
      onEnter: PropTypes.func,
      updateIndex: PropTypes.bool
    };
  }

  static get defaultProps() {
    return {
      index: 0,
      size: 3,
      elWidth: 100,
      circular: true,
      active: true,
      speed: 100,
      debounce: 82,
      className: 'carousel',
      childrenClassName: 'carousel-child',
      updateIndex: false
    };
  }

  constructor(props) {
    super(props);
    this.listenerId = addListener(this.keysHandler, this);
    this.timeout = null;
    this.movingCountDown = () => this.timeout = setTimeout(() =>
      _updateBinder(props.id, { moving: false, selectedId: this.selectedId }), props.speed);
    this.state = { cursor: props.index, elements: [] };
  }

  computeChildren(children) {
    let returnValue = children;
    if (Object.prototype.toString.call(children) !== '[object Array]') {
      returnValue = [children];
    }
    let inc = 1;
    while (returnValue.length < this.props.size + 4) {
      const addedValues = returnValue.map(child => {
        const props = { ...child.props, id: child.props.id + '_' + inc };
        return { ...child, props: props };
      });
      returnValue = returnValue.concat(addedValues);
      inc++;
    }
    return returnValue;
  }

  keysHandler(keyCode) {
    const { children, circular, onDownExit, onUpExit, onEnter } = this.props;
    const { cursor } = this.state;
    if (isActive(this.props) && !isBlocked()) {
      switch (keyCode) {
        case userConfig.left:
          if (!circular && cursor === 0) return;
          this.performAction(getPrev(children.length, cursor));
          break;
        case userConfig.right:
          if (!circular && cursor === children.length - 1) return;
          this.performAction(getNext(children.length, cursor));
          break;
        case userConfig.down:
          this.performCallback(onDownExit);
          break;
        case userConfig.up:
          this.performCallback(onUpExit);
          break;
        case userConfig.enter:
          this.performCallback(onEnter);
          break;
      }
    }
  }

  componentWillMount() {
    addCarouselToStore(this.props, CAROUSEL_TYPE);
    this.updateState(this.state.cursor, this.props.children);
  }

  componentWillUpdate({ index, children, updateIndex }) {
    if (hasDiff(children, this.props.children)) {
      const cursor = updateIndex ? index : this.state.cursor;
      this.updateState(cursor, children);
    }
  }

  performAction(cursor) {
    const { debounce, onChange, children } = this.props;
    block(debounce);
    clearTimeout(this.timeout);
    this.updateState(cursor, children);
    this.movingCountDown();
    execCb(onChange, this.selectedId, this);
  }

  updateState(cursor, children) {
    const computedChildren = this.computeChildren(children);
    const { id, size, circular } = this.props;
    this.selectedId = computedChildren[cursor].props.id;
    _updateBinder(id, { selectedId: this.selectedId, cursor, moving: true });
    this.setState({
      cursor,
      elements: build(computedChildren, size + 4, cursor, circular),
    });
  }

  performCallback(callback) {
    if (callback) {
      block();
      execCb(callback, this.selectedId, this);
    }
  }

  render() {
    const { size, elWidth, childrenClassName, className } = this.props;
    const { elements } = this.state;
    return <div className={className} style={{ overflow: 'hidden' }}>
      {elements.map((element, inc) => {
        if (!element) return;
        const gap = (inc - 2) * elWidth;
        return <div key={element.props.id} className={childrenClassName} style={{
          marginLeft: `${gap}px`,
          position: 'absolute',
          width: `${elWidth}px`,
          display: 'block',
          opacity: (gap === -(2 * elWidth) || gap === (size + 1) * elWidth) ? 0 : 1,
        }}>{element}</div>;
      })}
    </div>;
  }

  componentWillUnmount() {
    removeListener(this.listenerId);
  }

}

export default Carousel;
