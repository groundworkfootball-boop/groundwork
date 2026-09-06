/**
 * Club Code & Multi-Platform Invitation Utilities
 * GROUNDWORK Football Platform
 */

// Generate a memorable, unique club code
export function generateClubCode(clubName?: string): string {
  let prefix = 'FC';
  if (clubName) {
    const cleaned = clubName.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (cleaned.length >= 3) {
      prefix = cleaned.substring(0, 3);
    } else if (cleaned.length > 0) {
      prefix = cleaned.padEnd(3, 'X');
    }
  }
  // 4 random alphanumeric characters (excluding ambiguous chars 0, O, 1, I)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GW-${prefix}-${randomPart}`;
}

// Validate club code format
export function isValidClubCode(code: string): boolean {
  if (!code) return false;
  const trimmed = code.trim().toUpperCase();
  return /^GW-[A-Z0-9]{2,5}-[A-Z0-9]{3,6}$/.test(trimmed);
}

// Build the public registration / claim URL
export function getClubInviteUrl(clubCode: string, role = 'player'): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://groundwork.football';
  return `${origin}/register?clubCode=${encodeURIComponent(clubCode)}&role=${role}`;
}

export interface ShareContent {
  clubName: string;
  clubCode: string;
  inviteUrl: string;
  role?: string;
}

// Pre-formatted messages for invitations
export function buildInviteMessage({ clubName, clubCode, inviteUrl, role = 'player' }: ShareContent): string {
  return `⚽ You've been invited to join ${clubName} on GROUNDWORK!
Use our unique Club Code: ${clubCode}
Claim your spot and register here: ${inviteUrl}`;
}

// Multi-platform invite builders
export const multiPlatformShare = {
  whatsapp: (content: ShareContent): string => {
    const msg = buildInviteMessage(content);
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  },

  email: (content: ShareContent): { subject: string; body: string; mailto: string } => {
    const subject = `Invitation to join ${content.clubName} on GROUNDWORK`;
    const body = `Hi,\n\nYou have been invited to join ${content.clubName} on GROUNDWORK Football Recruitment Platform.\n\nUnique Club Code: ${content.clubCode}\n\nClick the link below to get started:\n${content.inviteUrl}\n\nBest regards,\n${content.clubName} Recruitment Team`;
    return {
      subject,
      body,
      mailto: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    };
  },

  sms: (content: ShareContent): string => {
    const msg = buildInviteMessage(content);
    return `sms:?&body=${encodeURIComponent(msg)}`;
  },

  twitter: (content: ShareContent): string => {
    const text = `Join ${content.clubName} on GROUNDWORK - the premier football recruitment platform! Club Code: ${content.clubCode}`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(content.inviteUrl)}`;
  },

  facebook: (content: ShareContent): string => {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(content.inviteUrl)}`;
  },

  linkedin: (content: ShareContent): string => {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(content.inviteUrl)}`;
  },
};

/**
 * Generate a standalone SVG data string or SVG elements for a QR-like matrix
 * Clean deterministic procedural QR code renderer without external dependencies.
 */
export function generateDeterministicQRMatrix(text: string, size = 21): boolean[][] {
  // 21x21 minimal standard grid
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Helper to place finder pattern
  const setFinder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          if (row + r < size && col + c < size) {
            matrix[row + r][col + c] = true;
          }
        }
      }
    }
  };

  // 3 position finder patterns (Top-Left, Top-Right, Bottom-Left)
  setFinder(0, 0);
  setFinder(0, size - 7);
  setFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Hash string into data bits
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  // Deterministically populate non-reserved cells
  let seed = Math.abs(hash);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder zones
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= size - 8;
      const inBL = r >= size - 8 && c < 8;
      if (inTL || inTR || inBL || r === 6 || c === 6) continue;

      seed = (seed * 9301 + 49297) % 233280;
      matrix[r][c] = (seed / 233280) > 0.48;
    }
  }

  return matrix;
}
