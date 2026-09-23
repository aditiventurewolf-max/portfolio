import fs from 'node:fs';
import { INBOX_FILE } from '../lib/paths.mjs';
import { getText } from '../lib/http.mjs';
import { toText, pageTitle } from '../lib/html.mjs';
import { info, warn } from '../lib/log.mjs';

const URL_RE = /https?:\/\/[^\s)>\]]+/g;

/** Only URLs under "## Pending" are queued. The rest is instructions and history. */
export function pendingSection(text) {
  const match = /^##\s*Pending\s*$([\s\S]*?)(?=^##\s|\Z)/im.exec(text);
  return (match ? match[1] : '').replace(/```[\s\S]*?```/g, '');
}

export function readInboxUrls() {
  if (!fs.existsSync(INBOX_FILE)) return [];
  const raw = fs.readFileSync(INBOX_FILE, 'utf8');
  return [...new Set(pendingSection(raw).match(URL_RE) ?? [])];
}

/** Move handled URLs out of Pending and into Processed. */
export function archiveUrls(handled) {
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
 * Fetch whatever is publicly served at each queued URL and hand the page text
 * on. Reading it is the session's job, not this script's.
 *
 * LinkedIn serves job pages to signed-out clients inconsistently. A blocked URL
 * stays queued with a note rather than being silently dropped.
 */
export async function fetchInbox() {
  const urls = readInboxUrls();
  if (!urls.length) return [];
  info(`inbox: ${urls.length} pending URL(s)`);

  const items = [];
  for (const url of urls) {
    const page = await getText(url, { timeoutMs: 25000, attempts: 2 });
    if (!page.ok || page.text.length < 400) {
      warn(`inbox: ${url} returned ${page.status || 'no body'}, leaving it queued`);
      continue;
    }
    items.push({
      type: 'unknown',
      source: 'inbox',
      provider: 'inbox',
      company: '',
      title: pageTitle(page.text).slice(0, 140),
      location: '',
      url,
      postedAt: null,
      description: toText(page.text, 14000),
      needsExtraction: true,
    });
  }
  return items;
}
