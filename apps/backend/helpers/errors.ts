export const convertErrorToString = (
  error: unknown,
  options?: { showNestedErrors: boolean },
): string => {
  if (options?.showNestedErrors && error instanceof AggregateError) {
    return [error, ...error.errors].map((error) => convertErrorToString(error)).join('\n\n')
  }

  if (error instanceof Error) {
    return `${error.name}: ${error.message}`
  }

  return String(error)
}
