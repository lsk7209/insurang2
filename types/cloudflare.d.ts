/**
 * Cloudflare Workers 타입 정의
 */

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1ExecResult>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number;
    duration: number;
    rows_read: number;
    rows_written: number;
  };
  results?: T[];
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DB?: D1Database;
      SMTP_HOST?: string;
      SMTP_PORT?: string;
      SMTP_SECURE?: string;
      SMTP_USER?: string;
      SMTP_PASS?: string;
      SMTP_FROM?: string;
      SOLAPI_API_KEY?: string;
      SOLAPI_API_SECRET?: string;
      SOLAPI_SENDER_PHONE?: string;
    }
  }
}

