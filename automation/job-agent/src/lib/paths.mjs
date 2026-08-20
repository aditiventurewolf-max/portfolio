import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(here, '..', '..');
export const DATA = path.join(ROOT, 'data');
export const PROFILE = path.join(ROOT, 'profile');
export const DRAFTS = path.join(DATA, 'drafts');
export const CONFIG_FILE = path.join(ROOT, 'config.json');
export const STATE_FILE = path.join(DATA, 'applications.json');
export const ATS_MAP_FILE = path.join(DATA, 'ats-map.json');
export const INBOX_FILE = path.join(DATA, 'inbox.md');
export const COMMANDS_FILE = path.join(DATA, 'commands.md');
export const DIGEST_FILE = path.join(DATA, 'digest.md');
