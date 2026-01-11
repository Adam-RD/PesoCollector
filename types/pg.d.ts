declare module "pg" {
  export interface PoolConfig {
    connectionString?: string;
    [key: string]: unknown;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    connect: (...args: any[]) => Promise<any>;
    query: (...args: any[]) => Promise<any>;
    end: () => Promise<void>;
  }
}
