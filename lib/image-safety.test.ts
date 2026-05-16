import { describe, it, expect, vi } from 'vitest';
import { enforceBase64Limit } from './image-safety';

describe('enforceBase64Limit', () => {

    const maxBytes = 1 * 1024 * 1024; // 1MB
    const fallback = "/fallback.png";

    it('passes safely if decoded bytes are exactly 1MB', () => {
        // Generate exactly 1,048,576 bytes of binary data
        const exact1MBBuffer = Buffer.alloc(maxBytes, 'a');
        const base64Data = exact1MBBuffer.toString('base64');
        const dataUri = `data:image/png;base64,${base64Data}`;

        const result = enforceBase64Limit(dataUri, maxBytes, fallback);
        expect(result).toBe(dataUri); // Should return the exact same URI
    });

    it('fails and returns fallback if decoded bytes are 1MB + 1 byte', () => {
        // Generate 1,048,577 bytes
        const oversizedBuffer = Buffer.alloc(maxBytes + 1, 'a');
        const base64Data = oversizedBuffer.toString('base64');
        const oversizedDataUri = `data:image/png;base64,${base64Data}`;

        // Spy on console.warn to verify our explicit warning logging 
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

        const result = enforceBase64Limit(oversizedDataUri, maxBytes, fallback);

        expect(result).toBe(fallback);
        expect(warnSpy).toHaveBeenCalled();
        expect(warnSpy.mock.calls[0][0]).toContain('Data URL exceeds decoded size limit');

        warnSpy.mockRestore();
    });

    it('does not count data URL header length towards the decoded byte limit', () => {
        // Generate exactly 1MB of binary data
        const exact1MBBuffer = Buffer.alloc(maxBytes, 'a');
        const base64Data = exact1MBBuffer.toString('base64');

        // Add a ridiculously long mock mime type to the header 
        // This makes the UTF-8 string size well over 1MB, but the decoded size exactly 1MB.
        const longHeader = `data:image/very-very-very-very-very-very-long-mime-type-name;base64,`;
        const dataUri = `${longHeader}${base64Data}`;

        const result = enforceBase64Limit(dataUri, maxBytes, fallback);
        expect(result).toBe(dataUri); // Should still pass because decoded payload is exactly 1MB
    });

    it('returns standard non-data URIs unmodified regardless of size limit', () => {
        const standardUrl = "https://example.com/some/image.png";

        // Even if we pass it 1 byte max, standard URLs should completely bypass the check
        const result = enforceBase64Limit(standardUrl, 1, fallback);
        expect(result).toBe(standardUrl);
    });

    it('returns the fallback for obviously malformed or invalid inputs', () => {
        expect(enforceBase64Limit(null, maxBytes, fallback)).toBe(fallback);
        expect(enforceBase64Limit(undefined, maxBytes, fallback)).toBe(fallback);
        expect(enforceBase64Limit(12345, maxBytes, fallback)).toBe(fallback);

        // Missing ;base64 definition
        expect(enforceBase64Limit("data:image/png,SGVsbG8gV29ybGQ=", maxBytes, fallback)).toBe(fallback);
    });
});
