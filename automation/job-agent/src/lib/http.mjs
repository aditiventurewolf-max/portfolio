import { warn } from './log.mjs';

const UA =
  'aditi-job-agent/1.0 (+https://github.com/aditiventurewolf-max/portfolio) personal job search';

const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * fetch with a timeout, a real user agent, and bounded backoff on transient
 * failures. Returns the Response, or null when every attempt failed.
 */
export async function request(url, { timeoutMs = 20000, attempts = 3, headers = {} } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'user-agent': UA, accept: '*/*', ...headers },
      });
      if (!res.ok && RETRYABLE.has(res.status) && attempt < attempts) {
        await sleep(1000 * 2 ** (attempt - 1));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt === attempts) {
        warn(`fetch failed for ${url}: ${err.message}`);
        return null;
      }
      await sleep(1000 * 2 ** (attempt - 1));
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

export async function getJson(url, options) {
  const res = await request(url, options);
  if (!res || !res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function getText(url, options) {
  const res = await request(url, {
    ...options,
    headers: { accept: 'text/html,application/xhtml+xml', ...(options?.headers ?? {}) },
  });
  if (!res || !res.ok) {
    return { ok: false, status: res ? res.status : 0, text: '' };
  }
  return { ok: true, status: res.status, text: await res.text() };
}
