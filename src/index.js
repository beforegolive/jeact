/** @jsx Jeact.createElement */
const Jeact = importFromBelow()

const randomLikes = () => Math.ceil(Math.random() * 100)

const stories = [
  {
    name: 'Jeact Introduction copied from Didact',
    url: 'http://bit.ly/2pX7HNn',
    likes: randomLikes(),
  },
  {
    name: 'Rendering DOM elements',
    url: 'http://bit.ly/2qCOejH',
    likes: randomLikes(),
  },
  {
    name: 'Element creation and JSX',
    url: 'http://bit.ly/2qGbw8S',
    likes: randomLikes(),
  },
  {
    name: 'Instances and reconciliation',
    url: 'http://bit.ly/2q4A746',
    likes: randomLikes(),
  },
  {
    name: 'Components and state',
    url: 'http://bit.ly/2rE16nh',
    likes: randomLikes(),
  },
]

const appElement = () => (
  <div>
    <ul>{stories.map(storyElement)}</ul>
  </div>
)

function storyElement(story) {
  const { name, url, likes } = story
  return (
    <li>
      <button onClick={(e) => handleClick(story)}>
        {likes}
        <span role="img" aria-label="">
          ❤️
        </span>
      </button>
      <a href={url}>{name}</a>
    </li>
  )
}

function handleClick(story) {
  story.likes += 1
  Jeact.render(appElement(), document.getElementById('root'))
}

Jeact.render(appElement(), document.getElementById('root'))

function importFromBelow() {
  const TEXT_ELEMENT = 'TEXT ELEMENT'
  let rootInstance = null

  function render(element, container) {
    const prevInstance = rootInstance
    const nextInstance = reconcile(container, prevInstance, element)

    rootInstance = nextInstance
  }

  function reconcile(parentDom, instance, element) {
    if (instance === null) {
      // Create instance
      const newInstance = instantiate(element)
      parentDom.appendChild(newInstance.dom)
      return newInstance
    } else if (element === null) {
      // Remove instance
      parentDom.removeChild(instance.dom)
      return null
    } else if (instance.element.type === element.type) {
      // update instance
      updateDomProperties(instance.dom, instance.element.props, element.props)
      instance.childInstances = reconcileChildren(instance, element)
      instance.element = element
      return instance
    } else {
      // Replace instance
      const newInstance = instantiate(element)
      parentDom.replaceChild(newInstance.dom, instance.dom)
      return newInstance
    }
  }

  function reconcileChildren(instance, element) {
    // TODO
    const dom = instance.dom
    const childInstances = instance.childInstances
    const nextChildElements = element.props.children || []
    const newChildInstances = []
    const count = Math.max(childInstances.length, nextChildElements.length)
    for (let i = 0; i < count; i++) {
      const childInstance = childInstances[i]
      const childElement = nextChildElements[i]
      const newChildInstance = reconcile(dom, childInstance, childElement)
      newChildInstances.push(newChildInstance)
    }

    return newChildInstances.filter((instance) => instance != null)
  }

  function instantiate(element) {
    const { type, props } = element
    const isTextElement = type === 'TEXT ELEMENT'
    const dom = isTextElement
      ? document.createTextNode('')
      : document.createElement(type)

    updateDomProperties(dom, [], props)

    const childElements = props.children || []
    const childInstances = childElements.map(instantiate)
    const childDoms = childInstances.map((childInstance) => childInstance.dom)
    childDoms.forEach((childDom) => dom.appendChild(childDom))

    const instance = { dom, element, childInstances }
    return instance
  }

  function updateDomProperties(dom, prevProps, nextProps) {
    // TODO
    const isEvent = (name) => name.startsWith('on')
    const isAttribute = (name) => !isEvent(name) && name !== 'children'

    Object.keys(prevProps)
      .filter(isEvent)
      .forEach((name) => {
        const eventType = name.toLowerCase().substring(2)
        dom.removeEventListener(eventType, prevProps[name])
      })

    Object.keys(prevProps)
      .filter(isAttribute)
      .forEach((name) => {
        dom[name] = null
      })

    Object.keys(nextProps)
      .filter(isAttribute)
      .forEach((name) => {
        dom[name] = nextProps[name]
      })

    Object.keys(nextProps)
      .filter(isEvent)
      .forEach((name) => {
        const eventType = name.toLowerCase().substring(2)
        dom.addEventListener(eventType, nextProps[name])
      })
  }

  // function render(element, parentDom) {
  //   const { type, props } = element

  //   const isTextElement = type === TEXT_ELEMENT
  //   const dom = isTextElement
  //     ? document.createTextNode('')
  //     : document.createElement(type)

  //   // add event listeners
  //   const isListener = (name) => name.startsWith('on')
  //   Object.keys(props)
  //     .filter(isListener)
  //     .forEach((name) => {
  //       const eventType = name.toLowerCase().substring(2)
  //       dom.addEventListener(eventType, props[name])
  //     })

  //   const isAttribute = (name) => !isListener(name) && name !== 'children'
  //   Object.keys(props)
  //     .filter(isAttribute)
  //     .forEach((name) => {
  //       dom[name] = props[name]
  //     })

  //   const childElements = props.children || []
  //   childElements.forEach((childElement) => render(childElement, dom))

  //   parentDom.appendChild(dom)
  // }

  function createElement(type, config, ...args) {
    const props = Object.assign({}, config)
    const hasChildren = args.length > 0
    const rawChildren = hasChildren ? [].concat(...args) : []
    props.children = rawChildren
      .filter((c) => c !== null && c !== false)
      .map((c) => (c instanceof Object ? c : createTextElement(c)))
    return { type, props }
  }

  function createTextElement(value) {
    return createElement(TEXT_ELEMENT, { nodeValue: value })
  }

  return { render, createElement }
}
