import { DTP } from '@ontomorph/dtp-sdk';

/**
 * Singleton DTP client.
 * Reads keys from environment variables — never from frontend code.
 *
 * Keys:
 *   ONTOMORPH_API_KEY_TEST — test-scoped Ontomorph platform key
 *   ONTOMORPH_HOLON_KEY    — HOLON clinical knowledge key
 */
let _client = null;

export function getDTP() {
  if (_client) return _client;

  if (!process.env.ONTOMORPH_API_KEY_TEST) {
    throw new Error('ONTOMORPH_API_KEY_TEST is not set. Check your .env file.');
  }
  if (!process.env.ONTOMORPH_HOLON_KEY) {
    throw new Error('ONTOMORPH_HOLON_KEY is not set. Check your .env file.');
  }

  _client = new DTP({
    apiKey:       process.env.ONTOMORPH_API_KEY_TEST,
    holonApiUrl:  'https://holon-api.ontomorph.com',
    holonApiKey:  process.env.ONTOMORPH_HOLON_KEY,
  });

  return _client;
}
