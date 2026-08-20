import fs from 'node:fs';
import { INBOX_FILE } from '../lib/paths.mjs';
import { getText } from '../lib/http.mjs';
import { toText, pageTitle } from '../lib/html.mjs';
import { ask } from '../lib/claude.mjs';
import { info, warn } from '../lib/log.mjs';

const URL_RE = /https?:\/\/[^\s)>\]]+/g;

const EXTRACT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['isJobPosting', 'company', 'title', 'location', 'description'],
  properties: {
    isJobPosting: { type: 'boolean' },
    company: { type: 'string' },
    title: { type: 'string' },
    location: { type: 'string' },
    description: {
      type: 'string',
      description: 'The role, requirements and team detail, as plain text.',
    },
  },
};

/** Only URLs under "## Pending" are queued. The rest is instructions and history. */
function pendingSection(text) {
  const match = /^##\s*Pending\s*$([\s\S]*?)(?=^##\s|\Z)/im.exec(text);
  return (match ? match[1] : '').replace(/```[\s\S]*?```/g, '');
}

function readInboxUrls() {
  if (!fs.existsSync(INBOX_FILE)) return [];
  const raw = fs.readFileSync(INBOX_FILE, 'utf8');
  return [...new Set(pendingSection(raw).match(URL_RE) ?? [])];
}

/** Move handled URLs into the Processed section so the next run skips them. */
function archiveUrls(handled) {
  if (!handled.length || !fs.existsSync(INBOX_FILE)) return;
  const raw = fs.readFileSync(INBOX_FILE, 'utf8');

  let pending = pendingSection(raw);
  for (const { url } of handled) {
    pending = pending.split(url).join('');
  }
  pending = pending
    .split('\n')
    .filter((line) => line.replace(/^[-*+\s]+/, '').length > 0)
    .join('\n')
    .trim();

  const stamp = new Date().toISOString().slice(0, 10);
  const added = handled
    .map(({ url, note }) => `- ${stamp} ${url}${note ? `: ${note}` : ''}`)
    .join('\n');

  let next = raw.replace(
    /^##\s*Pending\s*$([\s\S]*?)(?=^##\s|\Z)/im,
    `## Pending\n\n${pending}${pending ? '\n' : ''}\n`,
  );
  next = next.replace(/^##\s*Processed\s*$/im, `## Processed\n\n${added}`);
  fs.writeFileSync(INBOX_FILE, next);
}

/**
 * Anything pasted into data/inbox.md: a LinkedIn job link, a company careers
 * page, a tweet. Fetch what is publicly served and let Claude pull the posting
 * out of the page text.
 *
 * LinkedIn serves job pages to signed-out clients inconsistently. When the fetch
 * is blocked the URL is kept with a note, rather than silently dropped, so the
 * description can be pasted in by hand.
 */
export async function fetchInbox() {
  const urls = readInboxUrls();
  if (!urls.length) return [];
  info(`inbox: ${urls.length} pending URL(s)`);

  const postings = [];
  const handled = [];

  for (const url of urls) {
    const page = await getText(url, { timeoutMs: 25000, attempts: 2 });
    if (!page.ok || page.text.length < 400) {
      warn(`inbox: ${url} returned ${page.status || 'no body'}, leaving it queued`);
      continue;
    }

    const text = toText(page.text, 15000);
    const extracted = await ask({
      label: `extract ${url}`,
      effort: 'low',
      maxTokens: 4000,
      schema: EXTRACT_SCHEMA,
      system:
        'You pull structured job postings out of raw web page text. If the page is ' +
        'a login wall, a search results page, or not a single job posting, set ' +
        'isJobPosting to false. Never invent details that are not in the text.',
      prompt: `URL: ${url}\nPage title: ${pageTitle(page.text)}\n\nPage text:\n${text}`,
    });

    if (!extracted) {
      warn(`inbox: could not extract ${url}, leaving it queued`);
      continue;
    }
    if (!extracted.isJobPosting) {
      handled.push({ url, note: 'not a single job posting' });
      continue;
    }

    postings.push({
      source: 'inbox',
      provider: 'inbox',
      company: extracted.company || 'Unknown',
      title: extracted.title,
      location: extracted.location,
      url,
      postedAt: null,
      description: extracted.description,
    });
    handled.push({ url, note: `${extracted.title} at ${extracted.company}` });
  }

  archiveUrls(handled);
  return postings;
}
