// ─── Tag colour palette & helper ─────────────────────────────────────────────

const TAG_PALETTE = [
  { bg: '#FFE0E8', text: '#C41E61' },
  { bg: '#E0F0FF', text: '#1E4D8A' },
  { bg: '#E0FFE8', text: '#166534' },
  { bg: '#FFF0D9', text: '#92400E' },
  { bg: '#EDE0FF', text: '#5B21B6' },
  { bg: '#D9F9F6', text: '#0E7490' },
  { bg: '#FEFFD9', text: '#713F12' },
];

/**
 * Deterministically maps a tag string to a background/text colour pair.
 * Uses a simple polynomial hash so the same tag always gets the same colour.
 */
export function tagColor(tag: string): { bg: string; text: string } {
  let h = 0;
  for (const c of tag) h = (h * 31 + c.charCodeAt(0)) % TAG_PALETTE.length;
  return TAG_PALETTE[h];
}
