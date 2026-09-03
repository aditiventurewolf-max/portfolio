import { daysSince } from '../lib/store.mjs';

/**
 * When is the next touch due?
 *
 * Applications get a slow cadence, because a queue takes time to move and
 * nudging a recruiter on day three does nothing. Direct outreach to a founder
 * gets a fast one, because an unanswered email is forgotten in a week and four
 * touches over a fortnight is what actually converts.
 *
 * Both are measured from the last touch, not from the start, so a manual
 * message you sent yourself does not get double-counted.
 */
export function dueTouches(state, config) {
  const stop = new Set(config.cadence.stopOnStatus);
  const due = [];

  for (const item of Object.values(state.tracked)) {
    if (stop.has(item.status)) continue;
    if (item.status !== 'sent') continue;
    if (!item.sentAt) continue;

    const plan = config.cadence[item.track] ?? config.cadence.application;
    const touches = item.touches ?? [];
    if (touches.length >= plan.maxTouches) continue;

    const next = touches.length;
    const threshold = plan.days[next];
    if (threshold === undefined) continue;

    const gap = next === 0 ? threshold : threshold - plan.days[next - 1];
    const since = next === 0 ? daysSince(item.sentAt) : daysSince(touches[next - 1].at);

    if (since >= gap) {
      due.push({
        id: item.id,
        item,
        touchNumber: next + 1,
        totalTouches: plan.maxTouches,
        daysSinceSent: Math.floor(daysSince(item.sentAt)),
      });
    }
  }

  return due;
}

/**
 * What has actually worked so far. Fed back into every drafting run, so the
 * next pitch is shaped by the replies the last twenty got rather than by
 * whatever sounded good in isolation.
 */
export function feedbackSummary(state) {
  const tracked = Object.values(state.tracked);
  const sent = tracked.filter((i) => i.sentAt);
  const replied = sent.filter((i) =>
    ['replied', 'interviewing', 'offer'].includes(i.status),
  );

  const byTrack = {};
  for (const item of sent) {
    const bucket = (byTrack[item.track] ??= { sent: 0, replied: 0 });
    bucket.sent += 1;
    if (['replied', 'interviewing', 'offer'].includes(item.status)) bucket.replied += 1;
  }

  return {
    sent: sent.length,
    replied: replied.length,
    byTrack,
    wins: replied.map((i) => ({
      company: i.company,
      track: i.track,
      angle: i.draft?.angle ?? '',
      touches: (i.touches ?? []).length,
    })),
    silent: sent
      .filter((i) => i.status === 'sent' && (i.touches ?? []).length >= 2)
      .map((i) => ({ company: i.company, track: i.track, angle: i.draft?.angle ?? '' })),
  };
}
