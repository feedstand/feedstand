import { get } from 'lodash-es'
import { ValueParser } from '../types/system'

// Example value:
// <author xmlns:author="http://www.w3.org/2005/Atom">
//     <name>John Doe</name>
//     <title>Strategic Partner Development Manager</title>
//     <department>Chrome</department>
//     <company/>
// </author>
// Example feed: https://blog.google/rss/.
export const authorFromAtom: ValueParser<string> = (value) => {
  if (get(value, '$.xmlns:author') === 'http://www.w3.org/2005/Atom') {
    return get(value, 'name.0')
  }
}
