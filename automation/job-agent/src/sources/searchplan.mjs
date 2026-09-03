/**
 * The plan for the half of discovery that no free API can do.
 *
 * LinkedIn, X and Instagram have no usable public read API, and their own
 * endpoints block datacenter traffic, so a script cannot fetch posts from them.
 * What does work is search: those posts are publicly indexed, and the session
 * running this has a web search tool. So this module does not fetch anything. It
 * writes the queries, deterministically, and the session runs them.
 *
 * Hiring intent shows up in posts days or weeks before it shows up on a job
 * board, and often instead of ever showing up on one. That is the whole reason
 * this layer exists.
 */

/** Day-of-year, so the query slice rotates instead of repeating forever. */
function dayIndex(now) {
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  return Math.floor((now.getTime() - start) / 86400000);
}

export function buildSearchPlan(config, now = new Date()) {
  const search = config.sources.socialSearch ?? {};
  if (search.enabled === false) return [];

  const { platforms = {}, phrases = [], modifiers = [], maxQueries = 12 } = search;

  const queries = [];
  for (const [platform, spec] of Object.entries(platforms)) {
    if (spec.enabled === false) continue;
    for (const phrase of spec.phrases ?? phrases) {
      for (const modifier of spec.modifiers ?? modifiers) {
        queries.push({
          platform,
          query: [spec.scope, `"${phrase}"`, modifier].filter(Boolean).join(' '),
          lookingFor: spec.lookingFor ?? 'hiring intent in a post, not a job listing',
        });
      }
    }
  }

  if (queries.length <= maxQueries) return queries;

  // Rotate the window so a week of runs covers the whole set.
  const offset = (dayIndex(now) * maxQueries) % queries.length;
  const slice = [];
  for (let i = 0; i < maxQueries; i += 1) {
    slice.push(queries[(offset + i) % queries.length]);
  }
  return slice;
}
