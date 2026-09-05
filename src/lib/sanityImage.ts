import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "./sanity";

const builder = createImageUrlBuilder(sanityClient);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

/**
 * Resolves a photo/image field to a plain URL string, tolerating documents
 * that haven't been through scripts/migrate-photos-to-sanity-assets.ts yet
 * (where the field is still the old pasted-URL string rather than a real
 * Sanity image asset). Once every document is migrated this string branch
 * is dead, but it costs nothing to keep and avoids a hard migration cutover.
 */
export function resolveImage(source: SanityImageSource | string | null | undefined, width?: number): string {
  if (!source) return "";
  if (typeof source === "string") return source;
  const built = urlFor(source);
  return width ? built.width(width).url() : built.url();
}
