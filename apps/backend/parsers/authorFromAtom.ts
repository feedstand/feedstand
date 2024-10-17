import { get } from 'lodash-es'

// Correctly extract author name from Google atom feed.
// Example value:
// <author xmlns:author="http://www.w3.org/2005/Atom">
//     <name>Aron Halil</name>
//     <title>Strategic Partner Development Manager</title>
//     <department>Chrome</department>
//     <company/>
// </author>
// Example feed: https://blog.google/rss/.
export const authorFromAtom = (value: unknown) => {
    if (get(value, '$.xmlns:author') === 'http://www.w3.org/2005/Atom') {
        return get(value, 'name.0')
    }
}
