import { describe, it, expect } from 'vitest';
import {
  generateClubCode,
  isValidClubCode,
  getClubInviteUrl,
  multiPlatformShare,
  generateDeterministicQRMatrix,
} from './clubCode';

describe('Club Code & Multi-Platform Invites', () => {
  it('generates a valid club code format GW-XXX-XXXX', () => {
    const code = generateClubCode('Arsenal Academy');
    expect(code).toMatch(/^GW-[A-Z0-9]{3}-[A-Z0-9]{4}$/);
    expect(isValidClubCode(code)).toBe(true);
  });

  it('validates correct club codes and rejects malformed ones', () => {
    expect(isValidClubCode('GW-ARS-9B2F')).toBe(true);
    expect(isValidClubCode('GW-CHL-1234')).toBe(true);
    expect(isValidClubCode('INVALID-CODE')).toBe(false);
    expect(isValidClubCode('GW-12-123')).toBe(false);
    expect(isValidClubCode('')).toBe(false);
  });

  it('builds invite URL with clubCode query parameter', () => {
    const url = getClubInviteUrl('GW-ARS-9B2F');
    expect(url).toContain('clubCode=GW-ARS-9B2F');
    expect(url).toContain('role=player');
  });

  it('generates multi-platform share links', () => {
    const payload = {
      clubName: 'Arsenal FC',
      clubCode: 'GW-ARS-9B2F',
      inviteUrl: 'https://groundwork.football/register?clubCode=GW-ARS-9B2F',
    };

    expect(multiPlatformShare.whatsapp(payload)).toContain('api.whatsapp.com/send?text=');
    expect(multiPlatformShare.whatsapp(payload)).toContain('GW-ARS-9B2F');
    expect(multiPlatformShare.email(payload).mailto).toContain('mailto:?subject=');
    expect(multiPlatformShare.sms(payload)).toContain('sms:?&body=');
    expect(multiPlatformShare.twitter(payload)).toContain('twitter.com/intent/tweet');
  });

  it('generates deterministic QR matrix', () => {
    const matrix1 = generateDeterministicQRMatrix('GW-ARS-9B2F');
    const matrix2 = generateDeterministicQRMatrix('GW-ARS-9B2F');

    expect(matrix1).toHaveLength(21);
    expect(matrix1[0]).toHaveLength(21);
    // Deterministic: same text yields identical matrix
    expect(matrix1).toEqual(matrix2);
  });
});
