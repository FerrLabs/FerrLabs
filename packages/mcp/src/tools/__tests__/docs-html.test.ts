import { describe, expect, it } from 'vitest';
import { htmlToText } from '../docs-html.js';

describe('htmlToText', () => {
  it('does not resolve NUL bytes in the input as code block placeholders', () => {
    expect(htmlToText('\u00000\u0000')).toBe('0');
    expect(htmlToText('<pre>code</pre>\u00005\u0000')).toBe('```\ncode\n```\n\n5');
  });
});
