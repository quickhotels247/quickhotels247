// A small in-memory cache with expiry, for data many visitors share (home page
// prices, popular fares). Concurrent loads of the same key share one call.
// Per server instance: move to Redis when there's more than one.
export class TtlCache<T> {
  private readonly entries = new Map<string, { value: T; expiresAt: number }>();
  private readonly loading = new Map<string, Promise<T>>();

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    return entry && entry.expiresAt > Date.now() ? entry.value : undefined;
  }

  // The cached value even if it has expired (to show while refreshing).
  peek(key: string): T | undefined {
    return this.entries.get(key)?.value;
  }

  set(key: string, value: T, ttlMs: number) {
    this.entries.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  async getOrLoad(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;
    const running = this.loading.get(key);
    if (running) return running;
    const promise = load()
      .then((value) => {
        this.set(key, value, ttlMs);
        return value;
      })
      .finally(() => this.loading.delete(key));
    this.loading.set(key, promise);
    return promise;
  }
}
