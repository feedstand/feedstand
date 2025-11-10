type Tags = Record<string, string | number | boolean>

export const incrementMetric = (name: string, value = 1, tags?: Tags): void => {
  // TODO: Implement withSentry, Prometheus, Redis, etc.
}

export const recordDistribution = (
  name: string,
  value: number,
  unit?: string,
  tags?: Tags,
): void => {
  // TODO: Implement withSentry, Prometheus, Redis, etc.
}
