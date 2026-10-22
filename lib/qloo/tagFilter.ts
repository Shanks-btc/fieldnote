import type { Tag } from "./types";

/**
 * /v2/insights?filter.type=urn:tag returns tags of every entity type, so a TV show's
 * "taste profile" arrives full of restaurant and brand tags ("Meatballs", "Discover",
 * "Food & Beverage", "Three Star"). Fieldnote wants only tags about music, media and culture.
 */

/** Entity types whose tags are about entertainment/culture. */
const CULTURE_ENTITY_TYPES = new Set([
  "urn:entity:artist",
  "urn:entity:album",
  "urn:entity:movie",
  "urn:entity:tv_show",
  "urn:entity:podcast",
  "urn:entity:book",
  "urn:entity:videogame",
  "urn:entity:person",
  "urn:entity:actor",
  "urn:entity:director",
  "urn:entity:author",
]);

/** Tag categories that are never cultural, even if they leak onto a culture entity type. */
const BLOCKED_CATEGORY = /^urn:tag:(specialty_dish|setting|inclusivity|cost_description|credit_card|hotel_rating|genre:place|genre:brand|price|amenity|cuisine|dietary|decor|parking|payment|reservation|service)\b/;

/** Is this taste tag about music, entertainment or culture? */
export function isCultureTag(tag: Tag): boolean {
  if (BLOCKED_CATEGORY.test(tag.category)) return false;
  if (tag.appliesTo.length === 0) {
    // No entity-type info (e.g. /v2/tags results): fall back to the category alone.
    return /^urn:tag:(genre|subgenre|style|theme|music|keyword|audience|influence|interests|content|mood|archetype|plot|character)\b/.test(tag.category);
  }
  // Keep if it applies to any culture entity type; tags that apply only to places,
  // brands or unknown types are dropped.
  return tag.appliesTo.some((t) => CULTURE_ENTITY_TYPES.has(t));
}

export function filterCultureTags(tags: Tag[]): Tag[] {
  return tags.filter(isCultureTag);
}
