import { get } from 'lodash-es'

export const linkFromAtom = (value: unknown) => {
    if (get(value, '$.xmlns') === 'http://www.w3.org/2005/Atom') {
        return get(value, '$.href')
    }
}
