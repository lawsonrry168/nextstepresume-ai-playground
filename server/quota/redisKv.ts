export interface RedisKv {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  del(...keys: string[]): Promise<void>;
}
