import { describe, expect, it } from 'vitest'
import { linkFromAtom } from './linkFromAtom.ts'

describe('linkFromAtom', () => {
  it('should extract href when xmlns is Atom', () => {
    const input = {
      $: {
        rel: 'self',
        href: 'https://www.inc.com/rss/',
        xmlns: 'http://www.w3.org/2005/Atom',
      },
    }

    expect(linkFromAtom(input)).toBe('https://www.inc.com/rss/')
  })

  it('should return undefined when xmlns is not Atom', () => {
    const input = {
      $: {
        rel: 'self',
        href: 'https://www.inc.com/rss/',
        xmlns: 'http://some-other-namespace.com',
      },
    }

    expect(linkFromAtom(input)).toBeUndefined()
  })

  it('should return undefined when href is missing', () => {
    const input = {
      $: {
        rel: 'self',
        xmlns: 'http://www.w3.org/2005/Atom',
      },
    }

    expect(linkFromAtom(input)).toBeUndefined()
  })

  it('should return undefined for empty object', () => {
    const result = linkFromAtom({})

    expect(result).toBeUndefined()
  })

  it('should return undefined for null', () => {
    const result = linkFromAtom(null)

    expect(result).toBeUndefined()
  })

  it('should return undefined for undefined', () => {
    const result = linkFromAtom(undefined)

    expect(result).toBeUndefined()
  })
})
