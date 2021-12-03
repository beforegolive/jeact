function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === 'object' ? child : createTextElement(child)
      ),
    },
  }
}

function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  }
}

const isEvent = (key) => key.startsWith('on')
const isProperty = (key) => key !== 'children' && !isEvent(key)
const isNew = (prev, next) => (key) => prev[key] !== next[key]
const isGone = (prev, next) => (key) => !(key in next)

function createDom(fiber) {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type)

  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = fiber.props[name]
    })

  Object.keys(fiber.props)
    .filter(isEvent)
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, fiber.props[name])
    })

  return dom
}

function updateDom(dom, prevProps, nextProps) {
  // Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)[key])
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.removeEventListerner(eventType, prevProps[name])
    })

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = ''
    })

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name]
    })

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[name])
    })
}

function commitRoot() {
  // TODO add nodes to dom
  deletions.forEach(commitWork)
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }

  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }

  const domParent = domParentFiber.dom

  // const domParent = fiber.parent.dom
  // domParent.appendChild(fiber.dom)
  if (fiber.effectTag === 'PLACEMENT' && fiber.dom != null) {
    domParent.appendChild(fiber.dom)
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props)
  } else if (fiber.effectTag === 'DELETION') {
    // domParent.removeChild(fiber.dom)
    commitDeletion(fiber, domParent)
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent)
  }
}

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  }

  deletions = []
  nextUnitOfWork = wipRoot
}

let nextUnitOfWork = null
let currentRoot = null
let wipRoot = null
let deletions = null
// function render(element, container) {
//   // const dom = document.createElement(element.type)
//   const dom =
//     element.type === 'TEXT_ELEMENT'
//       ? document.createTextNode('')
//       : document.createElement(element.type)

//   const isProperty = (key) => key !== 'children'
//   Object.keys(element.props)
//     .filter(isProperty)
//     .forEach((name) => {
//       dom[name] = element.props[name]
//     })

//   element.props.children.forEach((child) => render(child, dom))
//   container.appendChild(dom)
// }

function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)

    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }

  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function reconcileChildren(wipFiber, elements) {
  let index = 0
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child

  let prevSibling = null

  while (index < elements.length || oldFiber != null) {
    const element = elements[index]
    let newFiber = null

    const sameType = oldFiber && element && element.type === oldFiber.type

    if (sameType) {
      // TODO update the node
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      }
    }

    if (element && !sameType) {
      // TODO add this node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: 'PLACEMENT',
      }
    }

    if (oldFiber && !sameType) {
      // TODO delete the oldFiber's node
      oldFiber.effectTag = 'DELETION'
      deletions.push(oldFiber)
    }

    // TODO compare oldFiber to element

    // const newFiber = {
    //   type: element.type,
    //   props: element.props,
    //   parent: fiber,
    //   dom: null,
    // }

    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    if (index === 0) {
      wipFiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber

    index++
  }
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  const elements = fiber.props.children
  reconcileChildren(fiber, elements)
}

let wipFiberForState = null
let hookIndex = null

function updateFunctionComponent(fiber) {
  wipFiberForState = fiber
  hookIndex = 0
  wipFiberForState.hooks = []
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}

function useState(initial) {
  // TODO
  const oldHook =
    wipFiberForState.alternate &&
    wipFiberForState.alternate.hooks &&
    wipFiberForState.alternate.hooks[hookIndex]

  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  }

  const actions = oldHook ? oldHook.queue : []
  actions.forEach((action) => {
    hook.state = action(hook.state)
  })

  const setState = (action) => {
    hook.queue.push(action)
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    }

    nextUnitOfWork = wipRoot
    deletions = []
  }

  wipFiberForState.hooks.push(hook)
  hookIndex++
  return [hook.state, setState]
}

function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }
  // if (!fiber.dom) {
  //   fiber.dom = createDom(fiber)
  // }

  // const elements = fiber.props.children
  // reconcileChildren(fiber, elements)

  if (fiber.child) {
    return fiber.child
  }

  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }

    nextFiber = nextFiber.parent
  }
}

const Jeact = {
  createElement,
  render,
  useState,
}

// const element = Jeact.createElement(
//   'div',
//   { id: 'foo' },
//   React.createElement('a', null, 'bar'),
//   React.createElement('b')
// )

// 下面的标记会触发babel用我们自己定义的方法处理jsx代码
// const element = (
//   <div style="background: salmon">
//     <h1>Hello World</h1>
//     <h2 style="text-align: right">from Jeact</h2>
//   </div>
// )

/** @jsx Jeact.createElement */
function Counter() {
  const [state, setState] = Jeact.useState(1)
  return <h1 onClick={() => setState((c) => c + 1)}>Count: {state}</h1>
}

const element = <Counter />
const container = document.getElementById('root')

Jeact.render(element, container)
