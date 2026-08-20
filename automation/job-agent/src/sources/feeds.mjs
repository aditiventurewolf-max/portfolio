import { getJson } from '../lib/http.mjs';
import { toText } from '../lib/html.mjs';
import { info, warn } from '../lib/log.mjs';

/**
 * Remotive's public API. Their terms ask for attribution, a link back to the
 * Remotive URL, and no more than a handful of calls a day, so keep the cron
 * daily and leave `source` on every posting.
 * https://remotive.com/api-documentation
 */
export async function fetchRemotive({ searches = [], limit = 40 }) {
  const postings = [];
  for (const search of searches) {
    const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(search)}&limit=${limit}`;
    const data = await getJson(url);
    if (!data?.jobs) {
      warn(`remotive: no results for "${search}"`);
      continue;
    }
    for (const job of data.jobs) {
      postings.push({
        source: 'feed:remotive',
        provider: 'remotive',
        company: job.company_name,
        title: job.title,
        location: job.candidate_required_location || 'Remote',
        url: job.url,
        postedAt: job.publication_date ?? null,
        description: toText(job.description ?? ''),
        extra: { salary: job.salary || '', tags: job.tags ?? [], via: 'Remotive' },
      });
    }
    info(`remotive "${search}": ${data.jobs.length} postings`);
  }
  return postings;
}

/**
 * Hacker News "Ask HN: Who is hiring?" via the public Algolia API. Top-level
 * comments in the newest thread are individual job posts.
 */
export async function fetchHnHiring({ keywords = [], maxComments = 300 }) {
  const search = await getJson(
    'https://hn.algolia.com/api/v1/search?query=Ask%20HN%3A%20Who%20is%20hiring%3F&tags=story&hitsPerPage=5',
  );
  const thread = (search?.hits ?? [])
    .filter((hit) => /who is hiring/i.test(hit.title ?? ''))
    .sort((a, b) => (b.created_at_i ?? 0) - (a.created_at_i ?? 0))[0];

  if (!thread) {
    warn('hn: could not find a "Who is hiring" thread');
    return [];
  }
  info(`hn thread: ${thread.title} (${thread.objectID})`);

  const comments = await getJson(
    `https://hn.algolia.com/api/v1/search?tags=comment,story_${thread.objectID}&hitsPerPage=${maxComments}`,
  );

  // Word boundaries matter here: a bare "ai" substring matches "said", "detail",
  // "available", and turns the whole thread into a false positive.
  const wanted = keywords.map(
    (k) => new RegExp(`\\b${k.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`),
  );
  const postings = [];

  for (const hit of comments?.hits ?? []) {
    const text = toText(hit.comment_text ?? '', 6000);
    if (text.length < 120) continue;
    const haystack = text.toLowerCase();
    if (wanted.length && !wanted.some((re) => re.test(haystack))) continue;

    // HN convention: "Company | Role | Location | ..." on the first line.
    const [firstLine] = text.split('\n');
    const parts = firstLine.split('|').map((p) => p.trim());
    postings.push({
      source: 'feed:hn-hiring',
      provider: 'hn',
      company: parts[0]?.slice(0, 80) || 'Unknown (HN)',
      title: parts[1]?.slice(0, 120) || firstLine.slice(0, 120),
      location: parts.slice(2, 4).join(', ').slice(0, 120),
      url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
      postedAt: hit.created_at ?? null,
      description: text,
      extra: { via: `HN ${thread.title}` },
    });
  }

  info(`hn: ${postings.length} matching posts`);
  return postings;
}
