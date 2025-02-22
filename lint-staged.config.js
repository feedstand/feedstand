export default {
  '*.{ts,tsx}': [() => 'npm run lint:tsc', 'npm run lint:prettier:base'],
  '*.{js,jsx}': ['npm run lint:prettier:base'],
  '*.{yml,yaml}': ['npm run lint:prettier:base'],
  '*.json': ['npm run lint:prettier:base'],
}
