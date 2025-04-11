import { describe, expect, it } from 'vitest'
import { authorFromAtom } from './authorFromAtom.js'

describe('authorFromAtom', () => {
  it('should extract author name from valid atom feed author', () => {
    const input = {
      $: { 'xmlns:author': 'http://www.w3.org/2005/Atom' },
      name: ['John Doe'],
      title: ['Strategic Partner Development Manager'],
      department: ['Chrome'],
      company: [''],
    }

    expect(authorFromAtom(input)).toBe('John Doe')
  })

  it('should handle author with multiple names and return first one', () => {
    const input = {
      $: { 'xmlns:author': 'http://www.w3.org/2005/Atom' },
      name: ['John Doe', 'Jane Doe'],
    }

    expect(authorFromAtom(input)).toBe('John Doe')
  })

  it('should return undefined when xmlns:author is not Atom', () => {
    const input = {
      $: { 'xmlns:author': 'http://some-other-namespace.com' },
      name: ['John Doe'],
    }

    expect(authorFromAtom(input)).toBeUndefined()
  })

  it('should return undefined when name is missing', () => {
    const input = {
      $: { 'xmlns:author': 'http://www.w3.org/2005/Atom' },
      title: ['Strategic Partner Development Manager'],
    }

    expect(authorFromAtom(input)).toBeUndefined()
  })

  it('should handle empty author object', () => {
    const input = {}
    expect(authorFromAtom(input)).toBeUndefined()
  })

  it('should handle null input', () => {
    expect(authorFromAtom(null)).toBeUndefined()
  })

  it('should handle undefined input', () => {
    expect(authorFromAtom(undefined)).toBeUndefined()
  })

  it('should handle author with empty name array', () => {
    const input = {
      $: { 'xmlns:author': 'http://www.w3.org/2005/Atom' },
      name: [],
    }

    expect(authorFromAtom(input)).toBeUndefined()
  })
})
