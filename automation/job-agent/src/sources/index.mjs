import { fetchCompanies, hydrate } from './ats.mjs';
import { fetchRemotive, fetchHnHiring } from './feeds.mjs';
import { fetchLaunches, fetchYcBatches } from './signals.mjs';
import { fetchInbox } from './inbox.mjs';
import { info } from '../lib/log.mjs';

export { hydrate };

/**
 * Two kinds of opportunity come out of here.
 *
 *   type: 'posting'  a specific advertised role. You apply, and so does everyone
 *                    else who saw the same board.
 *   type: 'company'  no posted role. You write to a person. Fewer of these, much
 *                    higher hit rate, and they need real research first.
 */
export async function discover(config) {
  const { companies = [], feeds = {}, signals = {}, inbox = {} } = config.sources;
  const batches = [];

  if (companies.length) batches.push(fetchCompanies(companies));
  if (feeds.remotive?.enabled) batches.push(fetchRemotive(feeds.remotive));
  if (feeds.hnHiring?.enabled) batches.push(fetchHnHiring(feeds.hnHiring));
  if (signals.launchHn?.enabled) batches.push(fetchLaunches(signals.launchHn));
  if (signals.ycBatches?.enabled) batches.push(fetchYcBatches(signals.ycBatches));
  if (inbox.enabled !== false) batches.push(fetchInbox());

  const results = await Promise.allSettled(batches);
  for (const result of results) {
    if (result.status === 'rejected') {
      info(`a source failed: ${result.reason?.message ?? result.reason}`);
    }
  }

  const items = results
    .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
    .map((item) => ({ type: item.type ?? 'posting', ...item }));

  const postings = items.filter((i) => i.type === 'posting').length;
  const orgs = items.filter((i) => i.type === 'company').length;
  info(`discovered ${items.length} items: ${postings} postings, ${orgs} companies`);
  return items;
}
