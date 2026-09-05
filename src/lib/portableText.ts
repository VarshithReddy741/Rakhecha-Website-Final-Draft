import { toHTML, type PortableTextComponents } from "@portabletext/to-html";
import type { PortableTextBlock } from "@portabletext/types";

// Matches the visual language ServicePanel's hand-authored bodies already
// use ("Our Services" bullet grids etc.) so Sanity-authored content boxes
// look consistent without editors needing to know any HTML/CSS.
const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => `<p class="font-body-md text-on-surface-variant leading-relaxed mb-4">${children}</p>`,
    h4: ({ children }) => `<h4 class="font-label-bold text-base font-bold text-primary-light mb-4 uppercase tracking-wider">${children}</h4>`,
  },
  list: {
    bullet: ({ children }) => `<div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 mb-4">${children}</div>`,
    number: ({ children }) => `<div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 mb-4">${children}</div>`,
  },
  listItem: {
    bullet: ({ children }) =>
      `<div class="fund-point flex items-center gap-4 rounded-lg -mx-3 px-3 py-2"><p class="font-label-bold text-primary">${children}</p></div>`,
    number: ({ children }) =>
      `<div class="fund-point flex items-center gap-4 rounded-lg -mx-3 px-3 py-2"><p class="font-label-bold text-primary">${children}</p></div>`,
  },
};

export function renderPortableText(blocks: PortableTextBlock[] | undefined | null): string {
  if (!blocks || blocks.length === 0) return "";
  return toHTML(blocks, { components });
}
