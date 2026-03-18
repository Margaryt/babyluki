/**
 * API configuration.
 *
 * During local development the backend runs on your machine.
 * On a real device via Expo Go, localhost won't work — use your
 * machine's LAN IP instead (e.g. 192.168.1.42).
 *
 * Update this when deploying the backend to Railway.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://babyluki-production.up.railway.app';
