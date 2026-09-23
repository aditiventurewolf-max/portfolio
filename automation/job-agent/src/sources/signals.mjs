import { getJson } from '../lib/http.mjs';
import { toText } from '../lib/html.mjs';
import { info, warn } from '../lib/log.mjs';

/**
 * Companies that just launched, from the "Launch HN" and "Show HN" threads.
 *
 * The point of this source is timing. A company that launched this week is
 * hiring before it has posted anything, and the founder is demonstrably reading
 * their inbox. That is a better moment to arrive than a job board is.
 */
export async function fetchLaunches({ maxStories = 60 }) {
  const data = await getJson(
    `https://hn.algolia.com/api/v1/search_by_date?query=%22Launch%20HN%22&tags=story&hitsPerPage=${maxStories}`,
  );
  if (!data?.hits) {
    warn('launches: Algolia returned nothing');
    return [];
  }

  const opportunities = [];
  for (const hit of data.hits) {
    const title = hit.title ?? '';
    if (!/^Launch HN:/i.test(title)) continue;

    // "Launch HN: Vendo (YC S26) – Let users build features on top of your product"
    const parsed = /^Launch HN:\s*([^(–—-]+?)(?:\s*\(([^)]*)\))?\s*[–—-]\s*(.*)$/.exec(title);
    if (!parsed) continue;
    const [, name, batch, pitch] = parsed;

    opportunities.push({
      type: 'company',
      source: 'signal:launch-hn',
      provider: 'hn',
      company: name.trim(),
      title: 'no posted role, direct outreach',
      location: '',
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      postedAt: hit.created_at ?? null,
      description: [
        `Launched on Hacker News${batch ? ` (${batch.trim()})` : ''} on ${(hit.created_at ?? '').slice(0, 10)}.`,
        `What they say they do: ${pitch.trim()}`,
        `HN discussion: https://news.ycombinator.com/item?id=${hit.objectID} (${hit.points ?? 0} points, ${hit.num_comments ?? 0} comments)`,
        hit.story_text ? `\nFounder's launch post:\n${toText(hit.story_text, 4000)}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      extra: { batch: batch?.trim() ?? '', hnId: hit.objectID },
    });
  }

  info(`launches: ${opportunities.length} recent Launch HN companies`);
  return opportunities;
}

/**
 * Small, current-batch YC companies. Team size is the filter that matters: under
 * about thirty people there is no recruiting layer, so the founder is the
 * hiring manager and the person who reads the email.
 */
export async function fetchYcBatches({ batches = [], maxTeamSize = 30 }) {
  const opportunities = [];

  for (const batch of batches) {
    let url = `https://api.ycombinator.com/v0.1/companies?batch=${encodeURIComponent(batch)}`;
    let pages = 0;

    while (url && pages < 12) {
      const data = await getJson(url);
      if (!data?.companies) break;
      pages += 1;

      for (const company of data.companies) {
        const teamSize = Number(company.teamSize ?? 0);
        if (teamSize > maxTeamSize) continue;
        if (company.status && company.status.toLowerCase() === 'inactive') continue;

        const regions = [company.regions, company.locations, company.allLocations]
          .flat()
          .filter(Boolean)
          .join(', ');

        opportunities.push({
          type: 'company',
          source: 'signal:yc',
          provider: 'yc',
          company: company.name,
          title: 'no posted role, direct outreach',
          location: regions,
          url: company.website || company.url,
          postedAt: null,
          description: [
            `YC ${company.batch}. Team of ${teamSize || 'unknown size'}.`,
            company.oneLiner ? `One liner: ${company.oneLiner}` : '',
            (company.industries ?? []).length ? `Industries: ${company.industries.join(', ')}` : '',
            regions ? `Where: ${regions}` : '',
            company.longDescription ? `\n${toText(company.longDescription, 3000)}` : '',
            company.url ? `\nYC profile: ${company.url}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
          extra: { batch: company.batch, teamSize, industries: company.industries ?? [] },
        });
      }

      url = data.nextPage ?? null;
    }
    info(`yc ${batch}: ${opportunities.filter((o) => o.extra.batch === batch).length} companies under ${maxTeamSize} people`);
  }

  return opportunities;
}
