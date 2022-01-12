const selectorParser = require('postcss-selector-parser')

const selectorProcessor = selectorParser(selectors => {
  let hoverSelectors = []

  selectors.filter(selector => {
    selector.walk(node => {
      if (node.type === 'pseudo' && node.value === ':hover') {
        hoverSelectors.push(selector.toString())
      }
    })
  })

  let nonHoverSelectors = selectors
    .map(selector => `${selector}`)
    .filter(selectorExpression => !hoverSelectors.includes(selectorExpression))

  return { hoverSelectors, nonHoverSelectors }
})

module.exports = ({
  fallback = false,
  fallbackSelector = 'html:not(.supports-touch)',
  rootSelectors = []
} = {}) => {
  function createMediaQuery (rule, { AtRule }) {
    let media = new AtRule({ name: 'media', params: '(hover: hover)' })

    media.source = rule.source

    media.append(rule)

    return media
  }

  function isAlreadyNested (rule) {
    let container = rule.parent

    while (container !== null && container.type !== 'root') {
      if (
        container.type === 'atrule' &&
        container.params.includes('hover: hover')
      ) {
        return true
      }

      container = container.parent
    }

    return false
  }

  return {
    postcssPlugin: 'postcss-hover-media-feature',

    Rule (rule, { AtRule }) {
      if (
        !rule.selector.includes(':hover') ||
        isAlreadyNested(rule) ||
        rule.selector.includes(fallbackSelector)
      ) {
        return
      }

      let {
        hoverSelectors = [],
        nonHoverSelectors = []
      } = selectorProcessor.transformSync(rule.selector, { lossless: false })

      let mediaQuery = createMediaQuery(
        rule.clone({ selectors: hoverSelectors }),
        { AtRule }
      )

      rule.after(mediaQuery)

      if (fallback) {
        rule.before(
          rule.clone({
            selectors: hoverSelectors.map(hoverSelector => {
              if (
                rootSelectors.some(rootSelector =>
                  hoverSelector.startsWith(rootSelector)
                )
              ) {
                return `${fallbackSelector}${hoverSelector}`
              }
              return `${fallbackSelector} ${hoverSelector}`
            })
          })
        )
      }

      if (nonHoverSelectors.length) {
        rule.replaceWith(rule.clone({ selectors: nonHoverSelectors }))

        return
      }

      rule.remove()
    }
  }
}

module.exports.postcss = true
