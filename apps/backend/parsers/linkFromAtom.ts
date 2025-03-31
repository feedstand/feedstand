import { get } from 'lodash-es'
import type { ValueParser } from '../types/system'

// Example value: {
//   value: [Object: null prototype] {
//     '$': [Object: null prototype] {
//       rel: 'self',
//       href: 'https://www.inc.com/rss/',
//       xmlns: 'http://www.w3.org/2005/Atom'
//     }
//   }
// }
// Example feed: https://www.inc.com/rss/.
export const linkFromAtom: ValueParser<string> = (value) => {
  if (get(value, '$.xmlns') === 'http://www.w3.org/2005/Atom') {
    return get(value, '$.href')
  }
}
