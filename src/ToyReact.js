window.ranges = [];
class ElementWrapper {
  constructor(type) {
    this._type = type;
    this.props = Object.create(null);
    this.vchildren = [];
  }

  get type() {
    return this._type;
  }

  get vdom() {
    return this;
  }

  setAttribute(key, val) {
    this.props[key] = val;
  }

  mountTo(range, isUpdate) {
    console.log(isUpdate);
    this.range = range;
    this.range.deleteContents();

    const element = document.createElement(this.type);
    for (let key in this.props) {
      if (key.match(/^on([\s\S]+)/)) {
        element.addEventListener(
          RegExp.$1.toLocaleLowerCase(),
          this.props[key]
        );
      } else {
        if (key === "className") {
          element.setAttribute("class", this.props[key]);
        } else {
          element.setAttribute(key, this.props[key]);
        }
      }
    }

    this.vchildren.forEach((vchild) => {
      const range = document.createRange();
      if (element.children.length) {
        range.setStartAfter(element.lastChild);
        range.setEndAfter(element.lastChild);
      } else {
        range.setStart(element, 0);
        range.setEnd(element, 0);
      }
      vchild.mountTo(range);
    });
    range.insertNode(element);
    if (isUpdate) {
      // 由于range.deleteContents 会使得相邻的range 的startOffset被减少了，所以要加回去
      const rangeIndex = window.ranges.indexOf(range);
      const nextRange = window.ranges[rangeIndex + 1];
      const siblingEl = element.nextElementSibling;
      siblingEl && nextRange.selectNode(siblingEl);
    }
  }

  appendChild(vchild) {
    this.vchildren.push(vchild);
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content);
    this._type = "#text";
  }
  get type() {
    return this._type;
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

  get type() {
    return this.constructor.name;
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
  update() {
    const vdom = this.vdom;
    if (this.oldVdom) {
      console.log("new:", vdom);
      console.log("old:", this.oldVdom);
      const isSameNode = (node1, node2) => {
        if (node1.type !== node2.type) {
          return false;
        }
        for (let name in node1.props) {
          if (
            typeof node1.props[name] === "object" &&
            typeof node2.props[name] === "object" &&
            JSON.stringify(node1.props[name]) ===
              JSON.stringify(node2.props[name])
          ) {
            continue;
          }
          if (node1.props[name] !== node2.props[name]) {
            return false;
          }
        }
        if (
          Object.keys(node1.props).length !== Object.keys(node2.props).length
        ) {
          return false;
        }
        return true;
      };
      const isSameTree = (node1, node2) => {
        if (!isSameNode(node1, node2)) {
          return false;
        }
        if (node1.children.length !== node2.children.length) {
          return false;
        }
        for (let i = 0; i < node1.children.length; i++) {
          if (!isSameTree(node1.children[i], node2.children[i])) {
            return false;
          }
        }
        return true;
      };
      const replace = (newTree, oldTree) => {
        if (isSameTree(newTree, oldTree)) {
          return;
        }
        if (!isSameNode(newTree, oldTree)) {
          newTree.mountTo(oldTree.range, true);
        } else {
          for (let i = 0; i < newTree.children.length; i++) {
            replace(newTree.children[i], oldTree.children[i]);
          }
        }
      };

      replace(vdom, this.oldVdom);
    } else {
      vdom.mountTo(this.range);
    }
    this.oldVdom = vdom;
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
  get vdom() {
    return this.render().vdom;
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
