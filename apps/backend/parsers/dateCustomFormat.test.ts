import { describe, expect, it } from 'vitest'
import { dateCustomFormat } from './dateCustomFormat'
import { datesInCustomFormat } from './dateCustomFormat.mock.json'

describe('parsers/dateCustomFormat', () => {
    for (const [input, output] of Object.entries(datesInCustomFormat)) {
        it(`should return correct date for ${input}`, () => {
            const result = dateCustomFormat(input)

            expect(result?.toISOString()).toEqual(output || undefined)
        })
    }
})
