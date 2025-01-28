import { describe, expect, it } from 'vitest'
import { removeNullBytes } from './strings'

describe('removeNullBytes', () => {
    describe('string inputs', () => {
        it('should handle regular string', () => {
            const input = 'Hello, World!'
            const expected = 'Hello, World!'

            expect(removeNullBytes(input)).toBe(expected)
        })

        it('should handle empty string', () => {
            const input = ''
            const expected = ''

            expect(removeNullBytes(input)).toBe(expected)
        })
    })

    describe('null byte handling', () => {
        it('should remove single NULL byte', () => {
            const input = 'Hello\0World'
            const expected = 'HelloWorld'

            expect(removeNullBytes(input)).toBe(expected)
        })

        it('should remove multiple NULL bytes', () => {
            const input = 'Hello\0\0World\0!'
            const expected = 'HelloWorld!'

            expect(removeNullBytes(input)).toBe(expected)
        })

        it('should handle string with only NULL bytes', () => {
            const input = '\0\0\0'
            const expected = ''

            expect(removeNullBytes(input)).toBe(expected)
        })
    })

    describe('non-string inputs', () => {
        it('should handle number', () => {
            const input = 123
            const expected = '123'

            expect(removeNullBytes(input)).toBe(expected)
        })

        it('should handle null', () => {
            const input = null
            const expected = 'null'

            expect(removeNullBytes(input)).toBe(expected)
        })

        it('should handle undefined', () => {
            const input = undefined
            const expected = 'undefined'

            expect(removeNullBytes(input)).toBe(expected)
        })
    })
})
