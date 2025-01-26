import { AxiosError } from 'axios'

export const isAggregateError = (error: unknown): error is AggregateError => {
    return (
        error instanceof AggregateError ||
        (error instanceof AxiosError && error.name === 'AggregateError')
    )
}

export const convertErrorToString = (
    error: unknown,
    options?: { showNestedErrors: boolean },
): string => {
    if (options?.showNestedErrors && isAggregateError(error)) {
        return [error, ...error.errors].map((error) => convertErrorToString(error)).join('\n\n')
    }

    if (error instanceof Error) {
        return error.stack || `${error.name}: ${error.message}`
    }

    return String(error)
}
