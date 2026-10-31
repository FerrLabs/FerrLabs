import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { extractContent, htmlToText } from '../docs-html.js';

const fragments = [
  '<main>',
  '</main>',
  '<div class="docs__prose">',
  '<div>',
  '</div>',
  '<script>',
  '</script>',
  '<style>',
  '<pre>',
  '</pre>',
  '<code>',
  '<h1>',
  '</h1>',
  '<h2 id=x>',
  '</h3>',
  '<li>',
  '<tr>',
  '</tr>',
  '<td>',
  '<br/>',
  '<!--',
  '-->',
  '&amp;',
  '&#x1F600;',
  '&#99999999;',
  '&bogus;',
  '\u0000',
  '\u00000\u0000',
  '<',
  '>',
  '"',
  '\n',
  'text',
];

const htmlSoup = fc
  .array(fc.oneof(fc.constantFrom(...fragments), fc.string({ maxLength: 6 })), { maxLength: 60 })
  .map((parts) => parts.join(''));

const runs = { numRuns: 500 };

describe('docs-html fuzz', () => {
  it('extractContent returns a slice of the input', () => {
    fc.assert(
      fc.property(htmlSoup, (html) => {
        const { html: extracted } = extractContent(html);
        expect(html.includes(extracted)).toBe(true);
      }),
      runs,
    );
  });

  it('htmlToText never throws and never leaks block placeholders', () => {
    fc.assert(
      fc.property(htmlSoup, (html) => {
        const text = htmlToText(html);
        expect(text).not.toContain('undefined');
        expect(text).toBe(text.trim());
        expect(text).not.toMatch(/\n{3,}/);
      }),
      runs,
    );
  });

  it('htmlToText drops script bodies', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[a-z]{6,12}$/), htmlSoup, (secret, around) => {
        const text = htmlToText(`<script>${secret}</script>${around.replace(/[<&\u0000]/g, '')}`);
        expect(text).not.toContain(secret);
      }),
      runs,
    );
  });
});
