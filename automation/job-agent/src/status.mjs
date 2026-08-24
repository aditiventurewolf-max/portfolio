/** What is in flight right now, printed for a human. No network, no cost. */
import { loadState, daysSince } from './lib/store.mjs';
import { loadConfig } from './lib/config.mjs';
import { dueTouches, feedbackSummary } from './stages/cadence.mjs';

const state = loadState();
const config = loadConfig();
const items = Object.values(state.tracked);

const order = ['drafted', 'sent', 'replied', 'interviewing', 'offer', 'queued', 'rejected', 'closed'];
const groups = new Map(order.map((status) => [status, []]));
for (const item of items) {
  if (!groups.has(item.status)) groups.set(item.status, []);
  groups.get(item.status).push(item);
}

console.log(`\n${items.length} tracked · ${Object.keys(state.dismissed ?? {}).length} ruled out\n`);

for (const [status, group] of groups) {
  if (!group.length) continue;
  console.log(`${status.toUpperCase()} (${group.length})`);
  for (const item of group) {
    const age = item.sentAt ? `${Math.floor(daysSince(item.sentAt))}d since sent` : '';
    const touches = (item.touches ?? []).length;
    console.log(
      `  ${item.id}  ${(item.company ?? '').slice(0, 22).padEnd(24)} ${(item.title ?? '').slice(0, 34).padEnd(36)} ${item.track.padEnd(12)} ${age}${touches ? ` · ${touches} touches` : ''}`,
    );
  }
  console.log('');
}

const due = dueTouches(state, config);
console.log(`${due.length} follow-up(s) due right now`);
for (const t of due) {
  console.log(`  ${t.id}  ${t.item.company} — touch ${t.touchNumber} of ${t.totalTouches}, day ${t.daysSinceSent}`);
}

const feedback = feedbackSummary(state);
console.log(`\nreply rate: ${feedback.replied}/${feedback.sent}`);
for (const [track, b] of Object.entries(feedback.byTrack)) {
  console.log(`  ${track}: ${b.replied}/${b.sent}`);
}
