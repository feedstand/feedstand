import { describe, expect, it } from 'vitest'
import dateCustomFormatJson from './dateCustomFormat.mock.json' with { type: 'json' }
import { dateCustomFormat } from './dateCustomFormat.ts'

const { datesInCustomFormat, datesInvalid } = dateCustomFormatJson

describe('parsers/dateCustomFormat', () => {
  for (const [input, output] of Object.entries(datesInCustomFormat)) {
    it(`should return correct date for ${input}`, () => {
      const result = dateCustomFormat(input)

      expect(result?.toISOString()).toEqual(output)
    })
  }

  for (const [input] of Object.entries(datesInvalid)) {
    it(`should return undefined for invalid date ${input}`, () => {
      const result = dateCustomFormat(input)

      expect(result).toBeUndefined()
    })
  }
})
