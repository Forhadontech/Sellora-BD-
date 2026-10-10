/**
 * Recursively removes all keys with `undefined` values from an object or array.
 * Firebase Firestore throws "Unsupported field value: undefined" if any field
 * (even deeply nested) contains `undefined`.
 */
export function removeUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item)) as unknown as T;
  }

  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = typeof value === 'object' && value !== null ? removeUndefined(value) : value;
      }
    }
    return cleaned as T;
  }

  return obj;
}
