const postcss = require('postcss')

const plugin = require('./')

function run (input, output, opts = {}) {
  let result = postcss([plugin(opts)]).process(input, {
    from: undefined
  })

  expect(result.css).toEqual(output)
  expect(result.warnings()).toHaveLength(0)
}

describe('basic usage', () => {
  it('works with a single selector', () => {
    run(
      '.this-is-a-class:hover {}',
      '@media (hover: hover) {.this-is-a-class:hover {}\n}'
    )
  })

  it('works when rule contains CSS declarations', () => {
    run(
      '.this-is-a-class:hover { text-decoration: underline; }',
      '@media (hover: hover) {.this-is-a-class:hover { text-decoration: underline; } }'
    )
  })

  it('works with descendant selectors', () => {
    run(
      '.s-some-scope p a:hover p {}',
      '@media (hover: hover) {.s-some-scope p a:hover p {}\n}'
    )

    run(
      '.js .link:hover .thing {}',
      '@media (hover: hover) {.js .link:hover .thing {}\n}'
    )
  })

  it('works with multiple selectors', () => {
    run(
      '.this-is-a-class:hover, .banana {}',
      '.banana {}@media (hover: hover) {.this-is-a-class:hover {}\n}'
    )

    run(
      '.this-is-a-class:hover, .banana:hover {}',
      '@media (hover: hover) {.this-is-a-class:hover, .banana:hover {}\n}'
    )
  })

  it('skips rules contained within `@media (hover: hover) {}`', () => {
    run(
      '@media (hover: hover) {.btn:hover {}}',
      '@media (hover: hover) {.btn:hover {}}'
    )

    run(
      '.p-index { @media (hover: hover) {.btn:hover {}} }',
      '.p-index { @media (hover: hover) {.btn:hover {}} }'
    )
  })

  it('works with pseudo-class functions that accept selector lists as an argument', () => {
    run(
      ':is(button, [role="button"]):hover { background-color: transparent; }',
      '@media (hover: hover) {:is(button,[role="button"]):hover { background-color: transparent; } }'
    )
  })

  it('works with :not(:hover) selectors', () => {
    run(
      '.this-is-a-class:not(:hover), .banana {}',
      '.banana {}@media (hover: hover) {.this-is-a-class:not(:hover) {}\n}'
    )

    run(
      '.this-is-a-class:not(:hover), .banana:not(:hover) {}',
      '@media (hover: hover) {.this-is-a-class:not(:hover), .banana:not(:hover) {}\n}'
    )
  })
})

describe('when `fallback: true`', () => {
  it('outputs the default fallback selector', () => {
    run(
      '.this-is-a-class:hover {}',
      [
        'html:not(.supports-touch) .this-is-a-class:hover {}',
        '@media (hover: hover) {.this-is-a-class:hover {}\n}'
      ].join(''),
      { fallback: true }
    )
  })

  it('outputs a custom fallback selector', () => {
    run(
      '.this-is-a-class:hover {}',
      [
        '.no-hover .this-is-a-class:hover {}',
        '@media (hover: hover) {.this-is-a-class:hover {}\n}'
      ].join(''),
      { fallback: true, fallbackSelector: '.no-hover' }
    )
  })

  it('chains `fallbackSelector` if `rootSelectors` matches', () => {
    run(
      '.t-dark .another-class:hover {}',
      [
        'html:not(.supports-touch).t-dark .another-class:hover {}',
        '@media (hover: hover) {.t-dark .another-class:hover {}\n}'
      ].join(''),
      { fallback: true, rootSelectors: ['.t-dark'] }
    )
  })

  it('works with multiple selectors', () => {
    run(
      '.this-is-a-class:hover, .banana {}',
      [
        'html:not(.supports-touch) .this-is-a-class:hover {}',
        '.banana {}',
        '@media (hover: hover) {.this-is-a-class:hover {}\n}'
      ].join(''),
      { fallback: true }
    )

    run(
      '.this-is-a-class:hover, .banana:hover {}',
      [
        'html:not(.supports-touch) .this-is-a-class:hover, html:not(.supports-touch) .banana:hover {}',
        '@media (hover: hover) {.this-is-a-class:hover, .banana:hover {}\n}'
      ].join(''),
      { fallback: true }
    )
  })
})
