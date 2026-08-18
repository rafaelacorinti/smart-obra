export function toSnakeCase<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(
        /[A-Z]/g,
        (letter) => `_${letter.toLowerCase()}`
      );
      result[snakeKey] = obj[key];
    }
  }
  return result;
}

export function toCamelCase<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      );
      result[camelKey] = obj[key];
    }
  }
  return result;
}

export function toCamelCaseArray<T extends Record<string, unknown>>(
  arr: T[]
): Record<string, unknown>[] {
  return arr.map(toCamelCase);
}

export function toSnakeCaseArray<T extends Record<string, unknown>>(
  arr: T[]
): Record<string, unknown>[] {
  return arr.map(toSnakeCase);
}
