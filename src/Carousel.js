/* eslint no-unused-vars:0 */
import React, { Component, PropTypes } from 'react';
import { build, getNext, getPrev } from './engines/carousel';
import { addListener, removeListener, globalStore } from './listener';
import { isBlocked, block } from './clock';
import { isActive } from './isActive';
import { execCb } from './funcHandler';
import { addKeyBinderToStore, _updateBinderState } from './redux/actions';
import { LEFT, RIGHT, DOWN, UP, ENTER } from './keys';

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
      debounce: 100,
      className: 'carousel',
      childrenClassName: 'carousel-child',
    };
  }

  constructor(props) {
    super(props);
    this.listenerId = addListener(this.keysHandler, this);
    this.timeout = null;
    this.sketch = [];
    this.movingCountDown = (cursor) => {
      this.timeout = setTimeout(() => {
        _updateBinderState(props.id, { moving: false });
        this.setState({
          cursor: cursor,
          transition: -(props.elWidth * 2),
          anim: false,
        });
      }, props.speed);
    };
    this.state = { cursor: props.index, transition: -(this.props.elWidth * 2) };
  }

  componentWillMount() {
    const { id, active, children } = this.props;
    addKeyBinderToStore(id, active);
    if (children.length !== 0) {
      this.initializeCarousel(children);
    }
  }

  componentWillUpdate(nextProps) {
    const { children } = nextProps;
    if (this.props.children.length === 0 && children.length !== 0) {
      this.initializeCarousel(children);
    }
  }

  initializeCarousel(children) {
    const { id, index } = this.props;
    this.selectedId = children[index].props.id;
    this.sketch = children.map(() => '');
    _updateBinderState(id, {
      selectedId: this.selectedId,
      cursor: index,
      moving: false,
    });
  }

  componentWillUnmount() {
    removeListener(this.listenerId);
  }

  performAction(cursor, direction) {
    const { debounce, children, id, elWidth, onChange } = this.props;
    const { transition } = this.state;
    block(debounce);
    clearTimeout(this.timeout);
    this.selectedId = children[cursor].props.id;
    _updateBinderState(id, {
      selectedId: this.selectedId,
      cursor: cursor,
      moving: true,
    });
    this.setState({
      transition: direction === RIGHT ? transition - elWidth : transition + elWidth,
      anim: true
    });
    this.movingCountDown(cursor);
    execCb(onChange, this.selectedId, this, this.props);
  }

  keysHandler(keyCode) {
    if (isActive(globalStore, this.props) && !isBlocked()) {
      const { cursor } = this.state;
      switch (keyCode) {
        case LEFT:
          if (!this.props.circular && cursor === 0) return;
          this.performAction(getPrev(this.sketch, cursor), LEFT);
          break;
        case RIGHT:
          if (!this.props.circular && cursor === this.props.children.length - 1) return;
          this.performAction(getNext(this.sketch, cursor), RIGHT);
          break;
        case DOWN:
          this.performCallback(this.props.onDownExit);
          break;
        case UP:
          this.performCallback(this.props.onUpExit);
          break;
        case ENTER:
          this.performCallback(this.props.onEnter);
          break;
        default:
          break;
      }
    }
  }

  performCallback(callback) {
    if (callback) {
      block();
      execCb(callback, this.selectedId, this, this.props);
    }
  }

  render() {
    const { size, speed, childrenClassName, circular, children, className } = this.props;
    const { cursor, transition, anim } = this.state;
    const ids = children.map((el, index) => index);
    const indexs = build(ids, size + 4, cursor, circular);
    return <div className={className} style={{
      position: 'absolute',
      overflow: 'hidden',
    }}>
      <div style={{
        width: '4000px',
        transform: `translate3d(${transition}px, 0, 0)`,
        transition: anim ? `transform ${speed}ms` : 'none',
        willChange: "transform",
      }}>
        {indexs.map((index) => {
          return <div key={index} className={childrenClassName} style={{
            display: 'inline-block'
          }}>{children[index]}</div>;
        })}
      </div>
    </div>;
  }

}

export default Carousel;
