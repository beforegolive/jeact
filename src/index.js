/** @jsx Jeact.createElement */
const Jeact = importFromBelow()

const stories = [
  {
    name: 'Jeact Introduction copied from Didact',
    url: 'http://bit.ly/2pX7HNn',
  },
  {
    name: 'Rendering DOM elements',
    url: 'http://bit.ly/2qCOejH',
  },
  {
    name: 'Element creation and JSX',
    url: 'http://bit.ly/2qGbw8S',
  },
  {
    name: 'Instances and reconciliation',
    url: 'http://bit.ly/2q4A746',
  },
  {
    name: 'Components and state',
    url: 'http://bit.ly/2rE16nh',
  },
]

const appElement = (
  <div>
    <ul>{stories.map(storyElement)}</ul>
  </div>
)

function storyElement({ name, url }) {
  const likes = Math.ceil(Math.random() * 100)
  return (
    <li>
      <button>
        {likes}
        <span role="img" aria-label="">
          ❤️
        </span>
      </button>
      <a href={url}>{name}</a>
    </li>
  )
}

Jeact.render(appElement, document.getElementById('root'))

function importFromBelow() {
  const TEXT_ELEMENT = 'TEXT ELEMENT'
  function render(element, parentDom) {
    const { type, props } = element

    const isTextElement = type === TEXT_ELEMENT
    const dom = isTextElement
      ? document.createTextNode('')
      : document.createElement(type)

    // add event listeners
    const isListener = (name) => name.startsWith('on')
    Object.keys(props)
      .filter(isListener)
      .forEach((name) => {
        const eventType = name.toLowerCase().substring(2)
        dom.addEventListener(eventType, props[name])
      })

    const isAttribute = (name) => !isListener(name) && name !== 'children'
    Object.keys(props)
      .filter(isAttribute)
      .forEach((name) => {
        dom[name] = props[name]
      })

    const childElements = props.children || []
    childElements.forEach((childElement) => render(childElement, dom))

    parentDom.appendChild(dom)
  }

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
