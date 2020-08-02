window.ranges = [];
class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type);
  }
  setAttribute(key, val) {
    if (key.match(/^on([\s\S]+)/)) {
      return this.root.addEventListener(RegExp.$1.toLocaleLowerCase(), val);
    } else if (key === "className") {
      key = "class";
    }
    this.root.setAttribute(key, val);
  }
  mountTo(range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
  appendChild(vchild) {
    const range = document.createRange();
    if (this.root.children.length) {
      range.setStartAfter(this.root.lastChild);
      range.setEndAfter(this.root.lastChild);
    } else {
      range.setStart(this.root, 0);
      range.setEnd(this.root, 0);
    }
    vchild.mountTo(range);
  }
}

class TextWrapper {
  constructor(type) {
    this.root = document.createTextNode(type);
  }
  mountTo(range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

class Component {
  constructor() {
    this.children = [];
    this.props = Object.create(null);
  }
  setAttribute(key, val) {
    if (key.match(/^on([\s\S]+)/)) {
      console.log(RegExp.$1);
    }
    this.props[key] = val;
    this[key] = val;
  }
  mountTo(range) {
    this.range = range;
    window.ranges.push(range);
    this.update();
  }
  update(isUpdate) {
    this.range.deleteContents();
    const vdom = this.render();
    vdom.mountTo(this.range);
    if (isUpdate) {
      // 由于range.deleteContents 会使得相邻的range 的startOffset被减少了，所以要加回去
      const rangeIndex = window.ranges.indexOf(this.range);
      const nextRange = window.ranges[rangeIndex + 1];
      if (
        nextRange &&
        nextRange.commonAncestorContainer === this.range.commonAncestorContainer
      ) {
        nextRange.setStart(nextRange.startContainer, nextRange.startOffset + 1);
        nextRange.setEnd(nextRange.endContainer, nextRange.endOffset);
      }
    }
  }
  appendChild(vdom) {
    this.children.push(vdom);
  }
  setState(state) {
    const merge = (oldState, newState) => {
      for (let p in newState) {
        if (typeof newState[p] === "object") {
          if (typeof oldState[p] !== "object") {
            oldState[p] = {};
          }
          merge(oldState[p], newState[p]);
        } else {
          oldState[p] = newState[p];
        }
      }
    };
    if (!this.state && state) {
      this.state = {};
    }
    merge(this.state, state);
    this.update(true);
  }
}

const ToyReact = {
  createElement(type, props, ...children) {
    let element;
    if (typeof type === "function") {
      element = new type();
    } else {
      element = new ElementWrapper(type);
    }
    for (let key in props) {
      if (props.hasOwnProperty(key)) {
        element.setAttribute(key, props[key]);
      }
    }
    function insertChildren(children) {
      for (let child of children) {
        if (typeof child === "object" && child instanceof Array) {
          insertChildren(child);
        } else {
          if (
            !(child instanceof Component) &&
            !(child instanceof ElementWrapper) &&
            !(child instanceof TextWrapper)
          ) {
            child = String(child);
          }
          if (typeof child === "string") {
            child = new TextWrapper(child);
          }
          element.appendChild(child);
        }
      }
    }
    insertChildren(children);
    return element;
  },

  render(vdom, element) {
    const range = document.createRange();
    if (element.children.length) {
      range.setStartAfter(element.lastChild);
      range.setEndAfter(element.lastChild);
    } else {
      range.setStart(element, 0);
      range.setEnd(element, 0);
    }
    vdom.mountTo(range);
  },
};

export { ToyReact, Component };
