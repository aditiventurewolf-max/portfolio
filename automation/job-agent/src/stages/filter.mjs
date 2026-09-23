const patterns = new Map();

/**
 * Word-boundary match, so "ai" does not hit "said" and "lead" does not hit
 * "leadership". Compiled once per keyword and reused across a run.
 */
function hasWord(text, keyword) {
  let re = patterns.get(keyword);
  if (!re) {
    const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    re = new RegExp(`\\b${escaped}\\b`, 'i');
    patterns.set(keyword, re);
  }
  return re.test(text);
}

/**
 * The free filter. Runs before anything reads a posting properly, so the
 * reading budget is spent on plausible roles instead of on the eight hundred
 * postings a set of job boards returns every day.
 *
 * Only applies to advertised postings. A company with no posted role has no
 * title to filter on, and is judged on the company itself.
 */
export function prefilter(item, targets) {
  if (item.type !== 'posting') return { keep: true };

  const title = item.title ?? '';

  const bad = (targets.excludeTitleKeywords ?? []).find((word) => hasWord(title, word));
  if (bad) return { keep: false, reason: `title has "${bad.trim()}"` };

  const wanted = targets.includeTitleKeywords ?? [];
  if (wanted.length && !wanted.some((word) => hasWord(title, word))) {
    return { keep: false, reason: 'title outside target functions' };
  }

  if (!item.description || item.description.length < 200) {
    return { keep: false, reason: 'no usable description' };
  }
  return { keep: true };
}
