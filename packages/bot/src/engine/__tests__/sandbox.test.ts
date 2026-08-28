import { describe, it, expect } from 'vitest';
import { evaluateDefinition } from '../sandbox.js';

describe('evaluateDefinition sandbox', () => {
  it('evaluates a valid definition', () => {
    const code = `
      module.exports = {
        meta: {},
        embeds: [{ title: 'Test' }],
        components: [],
      };
    `;
    const result = evaluateDefinition(code);
    expect(result.ok).toBe(true);
  });

  it('rejects a definition that tries to access process', () => {
    const code = `
      process.exit(1);
      module.exports = { meta: {} };
    `;
    const result = evaluateDefinition(code);
    expect(result.ok).toBe(false);
  });

  it('rejects a definition that tries to access require', () => {
    const code = `
      const fs = require('fs');
      module.exports = { meta: {} };
    `;
    const result = evaluateDefinition(code);
    expect(result.ok).toBe(false);
  });

  it('times out a definition that runs an infinite loop', () => {
    const code = `
      while (true) {}
      module.exports = { meta: {} };
    `;
    const result = evaluateDefinition(code);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('Evaluation error');
  });

  it('rejects a definition with no meta property', () => {
    const code = `module.exports = { title: 'Not a UIDefinition' };`;
    const result = evaluateDefinition(code);
    expect(result.ok).toBe(false);
  });

  it('evaluates a definition using embedBuilder global', () => {
    const code = `
      const embed = embedBuilder.create({ title: 'Hello', color: 0x5865f2 });
      module.exports = { meta: {}, embeds: [embed] };
    `;
    const result = evaluateDefinition(code);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.definition.embeds?.[0]?.title).toBe('Hello');
    }
  });
});
