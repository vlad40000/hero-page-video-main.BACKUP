export function productPath(slug: string) {
  return `/products/${encodeURIComponent(slug)}`;
}
