import { getJson } from '../lib/http.mjs';
import { toText } from '../lib/html.mjs';
import { info, warn } from '../lib/log.mjs';
import { loadAtsMap, saveAtsMap } from '../lib/store.mjs';

/**
 * Public, documented job-board endpoints. No auth, no scraping behind a login.
 * Each provider takes a company slug and returns normalised postings.
 *
 * `detail` is optional: providers whose list endpoint omits the description
 * expose it so the pipeline can fetch a full description only for the handful
 * of postings that survive the title prefilter.
 */
export const PROVIDERS = [
  {
    name: 'greenhouse',
    url: (slug) => `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`,
    parse: (data, slug) =>
      (data?.jobs ?? []).map((job) => ({
        provider: 'greenhouse',
        company: job.company_name || slug,
        title: job.title,
        location: job.location?.name ?? '',
        url: job.absolute_url,
        postedAt: job.updated_at ?? null,
        // Greenhouse returns entity-encoded HTML, so decode twice.
        description: toText(toText(job.content ?? '')),
      })),
  },
  {
    name: 'lever',
    url: (slug) => `https://api.lever.co/v0/postings/${slug}?mode=json`,
    parse: (data, slug) =>
      (Array.isArray(data) ? data : []).map((job) => ({
        provider: 'lever',
        company: slug,
        title: job.text,
        location: job.categories?.location ?? '',
        url: job.hostedUrl,
        postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
        description: toText(job.descriptionPlain || job.description || ''),
      })),
  },
  {
    name: 'ashby',
    url: (slug) => `https://api.ashbyhq.com/posting-api/job-board/${slug}`,
    parse: (data, slug) =>
      (data?.jobs ?? [])
        .filter((job) => job.isListed !== false)
        .map((job) => ({
          provider: 'ashby',
          company: slug,
          title: job.title?.trim(),
          location: [job.location, ...(job.secondaryLocations ?? []).map((l) => l.location)]
            .filter(Boolean)
            .join(' / '),
          url: job.jobUrl || job.applyUrl,
          postedAt: job.publishedAt ?? null,
          description: toText(job.descriptionPlain || job.descriptionHtml || ''),
        })),
  },
  {
    name: 'workable',
    url: (slug) => `https://apply.workable.com/api/v1/widget/accounts/${slug}?details=true`,
    parse: (data, slug) =>
      (data?.jobs ?? []).map((job) => ({
        provider: 'workable',
        company: data?.name || slug,
        title: job.title,
        location: [job.city, job.country].filter(Boolean).join(', '),
        url: job.url || job.shortlink,
        postedAt: job.created_at ?? null,
        description: toText(job.description || ''),
      })),
  },
  {
    name: 'recruitee',
    url: (slug) => `https://${slug}.recruitee.com/api/offers/`,
    parse: (data, slug) =>
      (data?.offers ?? []).map((job) => ({
        provider: 'recruitee',
        company: job.company_name || slug,
        title: job.title,
        location: [job.city, job.country].filter(Boolean).join(', '),
        url: job.careers_url || job.url,
        postedAt: job.published_at ?? null,
        description: toText(job.description || ''),
      })),
  },
  {
    name: 'smartrecruiters',
    url: (slug) => `https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=100`,
    parse: (data, slug) =>
      (data?.content ?? []).map((job) => ({
        provider: 'smartrecruiters',
        company: job.company?.name || slug,
        title: job.name,
        location: [job.location?.city, job.location?.country].filter(Boolean).join(', '),
        url: `https://jobs.smartrecruiters.com/${slug}/${job.id}`,
        postedAt: job.releasedDate ?? null,
        description: '',
        detailRef: job.id,
      })),
    detail: async (slug, ref) => {
      const data = await getJson(
        `https://api.smartrecruiters.com/v1/companies/${slug}/postings/${ref}`,
      );
      const sections = data?.jobAd?.sections ?? {};
      return toText(
        ['companyDescription', 'jobDescription', 'qualifications', 'additionalInformation']
          .map((key) => sections[key]?.text ?? '')
          .filter(Boolean)
          .join('\n\n'),
      );
    },
  },
];

const byName = new Map(PROVIDERS.map((p) => [p.name, p]));

/**
 * Work out which ATS a company slug lives on by trying each provider once, then
 * remember the answer in data/ats-map.json so later runs make one call per company.
 */
export async function resolveProvider(slug, atsMap) {
  const remembered = atsMap[slug];
  if (remembered === 'none') return null;
  if (remembered && byName.has(remembered)) return byName.get(remembered);

  for (const provider of PROVIDERS) {
    const data = await getJson(provider.url(slug), { attempts: 1, timeoutMs: 15000 });
    if (!data) continue;
    const jobs = provider.parse(data, slug);
    if (jobs.length > 0) {
      info(`resolved ${slug} -> ${provider.name} (${jobs.length} postings)`);
      atsMap[slug] = provider.name;
      return provider;
    }
  }
  warn(`no public job board found for "${slug}"`);
  atsMap[slug] = 'none';
  return null;
}

export async function fetchCompanies(slugs) {
  const atsMap = loadAtsMap();
  const postings = [];

  for (const slug of slugs) {
    const provider = await resolveProvider(slug, atsMap);
    if (!provider) continue;

    const data = await getJson(provider.url(slug));
    if (!data) {
      warn(`${slug}: ${provider.name} fetch failed this run`);
      continue;
    }
    const jobs = provider.parse(data, slug).filter((job) => job.title && job.url);
    for (const job of jobs) {
      postings.push({ ...job, source: `ats:${provider.name}`, slug });
    }
  }

  saveAtsMap(atsMap);
  return postings;
}

/** Fill in a description for providers whose list endpoint does not carry one. */
export async function hydrate(job) {
  if (job.description || !job.detailRef) return job;
  const provider = byName.get(job.provider);
  if (!provider?.detail) return job;
  const description = await provider.detail(job.slug, job.detailRef);
  return { ...job, description: description ?? '' };
}
