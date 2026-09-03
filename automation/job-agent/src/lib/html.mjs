const BLOCK_TAGS = /<\/(p|div|li|h[1-6]|tr|section|article|br)>/gi;

/** Turn a job description blob (HTML or plain) into readable plain text. */
export function toText(input = '', maxChars = 12000) {
  const text = String(input)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(BLOCK_TAGS, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&mdash;|&ndash;/gi, '-')
    .replace(/[ \t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text.length > maxChars ? `${text.slice(0, maxChars)}\n[truncated]` : text;
}

/** Best-effort <title> extraction, used when a scraped page has no JSON-LD. */
export function pageTitle(html = '') {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match ? toText(match[1], 300) : '';
}
