/** Cache successful initialization, but allow a later retry after failure. */
export function retryableResource<T>(create: () => Promise<T>) {
  let pending: Promise<T> | null = null;
  return () => {
    pending ??= Promise.resolve().then(create).catch((error) => { pending = null; throw error; });
    return pending;
  };
}
