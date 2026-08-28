import * as vm from 'node:vm';
import type { UIDefinition } from 'shared/ui-types';

const SANDBOX_GLOBALS = {
  Object,
  Array,
  String,
  Number,
  Boolean,
  RegExp,
  Map,
  Set,
  Promise,
  Error,
  TypeError,
  RangeError,
  SyntaxError,
  Math,
  Date,
  JSON,
  parseInt,
  parseFloat,
  isNaN,
  isFinite,
  encodeURIComponent,
  decodeURIComponent,
  encodeURI,
  decodeURI,
  console: {
    log: (...args: unknown[]) => console.log('[sandbox]', ...args),
    warn: (...args: unknown[]) => console.warn('[sandbox]', ...args),
    error: (...args: unknown[]) => console.error('[sandbox]', ...args),
  },
  Math,
  Date,
  JSON,
  parseInt,
  parseFloat,
  isNaN,
  isFinite,
  encodeURIComponent,
  decodeURIComponent,
  embedBuilder: {
    create(options: {
      title?: string;
      description?: string;
      color?: number;
      fields?: Array<{ name: string; value: string; inline?: boolean }>;
      footer?: string;
      thumbnail?: string;
      image?: string;
      timestamp?: boolean;
    }) {
      return {
        title: options.title,
        description: options.description,
        color: options.color,
        fields: options.fields ?? [],
        footer: options.footer !== undefined ? { text: options.footer } : undefined,
        thumbnail: options.thumbnail !== undefined ? { url: options.thumbnail } : undefined,
        image: options.image !== undefined ? { url: options.image } : undefined,
        timestamp: options.timestamp === true ? new Date().toISOString() : undefined,
      };
    },
  },
} as const;

export type SandboxResult =
  | { readonly ok: true; readonly definition: UIDefinition }
  | { readonly ok: false; readonly error: string };

type ModuleExports = Record<string, unknown>;

export function evaluateDefinition(code: string): SandboxResult {
  const exportsObj: ModuleExports = {};
  const moduleObj = { exports: exportsObj };
  const context = vm.createContext({
    ...SANDBOX_GLOBALS,
    module: moduleObj,
    exports: exportsObj,
  });

  try {
    vm.runInContext(code, context, {
      timeout: 2000,
      displayErrors: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Evaluation error: ${message}` };
  }

  const exported: ModuleExports = moduleObj.exports;
  const candidate = 'default' in exported ? exported['default'] : exported;

  if (!isUIDefinition(candidate)) {
    return {
      ok: false,
      error: 'Definition must export an object with at least a `meta` property',
    };
  }

  return { ok: true, definition: candidate };
}

function isUIDefinition(value: unknown): value is UIDefinition {
  if (typeof value !== 'object' || value === null) return false;
  if (!('meta' in value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record['meta'] === 'object';
}
