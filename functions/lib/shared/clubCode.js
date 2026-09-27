/** Server-side unique club code generator (duplicate of client util, kept pure). */
const CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export function generateClubCode(clubName) {
    let prefix = 'FC';
    if (clubName) {
        const cleaned = clubName.replace(/[^a-zA-Z]/g, '').toUpperCase();
        prefix = cleaned.length >= 3 ? cleaned.substring(0, 3) : cleaned.length > 0 ? cleaned.padEnd(3, 'X') : 'FC';
    }
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
        randomPart += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }
    return `GW-${prefix}-${randomPart}`;
}
export function isValidClubCode(code) {
    const trimmed = (code ?? '').trim().toUpperCase();
    return /^GW-[A-Z0-9]{2,5}-[A-Z0-9]{3,6}$/.test(trimmed);
}
