export const parseValue = <
  T,
  V,
  P extends (value: V) => T | undefined,
  F extends T | undefined = undefined,
>(
  value: V,
  parsers: Array<P>,
  fallback?: F,
): F extends undefined ? ReturnType<P> : NonNullable<ReturnType<P>> => {
  for (const parser of parsers) {
    const parsedValue = parser(value)

    if (parsedValue !== undefined) {
      return parsedValue as NonNullable<ReturnType<P>>
    }
  }

  return fallback as NonNullable<ReturnType<P>>
}
