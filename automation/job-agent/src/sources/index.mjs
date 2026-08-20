import { fetchCompanies, hydrate } from './ats.mjs';
import { fetchRemotive, fetchHnHiring } from './feeds.mjs';
import { fetchInbox } from './inbox.mjs';
import { info } from '../lib/log.mjs';

export { hydrate };

/** Run every enabled source and return one flat list of raw postings. */
export async function discoverPostings(config) {
  const { companies = [], feeds = {}, inbox = {} } = config.sources;
  const batches = [];

  if (companies.length) {
    batches.push(fetchCompanies(companies));
  }
  if (feeds.remotive?.enabled) {
    batches.push(fetchRemotive(feeds.remotive));
  }
  if (feeds.hnHiring?.enabled) {
    batches.push(fetchHnHiring(feeds.hnHiring));
  }
  if (inbox.enabled !== false) {
    batches.push(fetchInbox());
  }

  const results = await Promise.allSettled(batches);
  const postings = results.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : [],
  );

  for (const result of results) {
    if (result.status === 'rejected') {
      info(`a source failed: ${result.reason?.message ?? result.reason}`);
    }
  }

  info(`discovered ${postings.length} raw postings`);
  return postings;
}
