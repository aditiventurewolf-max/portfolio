/**
 * Which job board does a company use?
 *
 *   npm run probe -- supertails zepto atlan
 *
 * Prints the provider and posting count for each slug, and records the answer in
 * data/ats-map.json so the daily run does not have to guess again. Useful for
 * building up the company list without editing config.json blind.
 */
import { PROVIDERS } from './sources/ats.mjs';
import { getJson } from './lib/http.mjs';
import { loadAtsMap, saveAtsMap } from './lib/store.mjs';

const slugs = process.argv.slice(2);
if (!slugs.length) {
  console.error('usage: npm run probe -- <company-slug> [more-slugs...]');
  process.exit(1);
}

const atsMap = loadAtsMap();

for (const slug of slugs) {
  let found = false;
  for (const provider of PROVIDERS) {
    const data = await getJson(provider.url(slug), { attempts: 1, timeoutMs: 15000 });
    const jobs = data ? provider.parse(data, slug) : [];
    if (jobs.length) {
      console.log(`${slug.padEnd(28)} ${provider.name.padEnd(16)} ${jobs.length} postings`);
      console.log(`  e.g. ${jobs[0].title} (${jobs[0].location || 'no location'})`);
      atsMap[slug] = provider.name;
      found = true;
      break;
    }
  }
  if (!found) {
    console.log(`${slug.padEnd(28)} no public board found`);
    atsMap[slug] = 'none';
  }
}

saveAtsMap(atsMap);
