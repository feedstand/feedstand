/** @type {import('prettier').Config} */
const config = {
  endOfLine: 'lf',
  useTabs: false,
  tabWidth: 2,
  semi: false,
  printWidth: 100,
  singleQuote: true,
  jsxSingleQuote: false,
  quoteProps: 'consistent',
  trailingComma: 'all',
  overrides: [
    {
      files: '*.json',
      options: {
        trailingComma: 'none',
      },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        singleQuote: false,
      },
    },
  ],
}

if (process.env.ORGANIZE_IMPORTS) {
  config.plugins ||= []
  config.plugins.push('prettier-plugin-organize-imports')
}

export default config
