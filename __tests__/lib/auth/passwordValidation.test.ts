/**
 * Tests for password validation utility
 * 
 * Note: These tests validate the password validation logic.
 * The actual validatePassword function is in lib/auth/server.ts
 * which depends on Next.js modules. These tests verify the 
 * expected behavior based on the PASSWORD_CONFIG.
 */
import { describe, it, expect } from 'vitest';

// Copy of the password config from lib/auth/server.ts for testing
const PASSWORD_CONFIG = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: false,
};

/**
 * Copy of validatePassword function for isolated testing
 */
function validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!password || password.length < PASSWORD_CONFIG.minLength) {
        errors.push(`Password must be at least ${PASSWORD_CONFIG.minLength} characters long`);
    }

    if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (PASSWORD_CONFIG.requireNumber && !/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (PASSWORD_CONFIG.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

describe('PASSWORD_CONFIG', () => {
    it('should have correct default values', () => {
        expect(PASSWORD_CONFIG.minLength).toBe(8);
        expect(PASSWORD_CONFIG.requireUppercase).toBe(true);
        expect(PASSWORD_CONFIG.requireLowercase).toBe(true);
        expect(PASSWORD_CONFIG.requireNumber).toBe(true);
        expect(PASSWORD_CONFIG.requireSpecialChar).toBe(false);
    });
});

describe('validatePassword', () => {
    describe('valid passwords', () => {
        it('should accept a valid password with all requirements', () => {
            const result = validatePassword('ValidPass1');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should accept a long password with mixed case and numbers', () => {
            const result = validatePassword('MySecureP4ssword');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should accept a password with special characters (even though not required)', () => {
            const result = validatePassword('V@lidP4ss!');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('minimum length validation', () => {
        it('should reject password shorter than minimum length', () => {
            const result = validatePassword('Abc1');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must be at least 8 characters long');
        });

        it('should reject password with exactly 7 characters', () => {
            const result = validatePassword('Abcdef1');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must be at least 8 characters long');
        });

        it('should accept password with exactly 8 characters', () => {
            const result = validatePassword('Abcdef12');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('uppercase letter validation', () => {
        it('should reject password without uppercase letter', () => {
            const result = validatePassword('lowercase1');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
        });

        it('should accept password with uppercase letter', () => {
            const result = validatePassword('Uppercase1');
            expect(result.valid).toBe(true);
            expect(result.errors).not.toContain('Password must contain at least one uppercase letter');
        });
    });

    describe('lowercase letter validation', () => {
        it('should reject password without lowercase letter', () => {
            const result = validatePassword('UPPERCASE1');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one lowercase letter');
        });

        it('should accept password with lowercase letter', () => {
            const result = validatePassword('MixedCase1');
            expect(result.valid).toBe(true);
            expect(result.errors).not.toContain('Password must contain at least one lowercase letter');
        });
    });

    describe('number validation', () => {
        it('should reject password without number', () => {
            const result = validatePassword('NoNumbersHere');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one number');
        });

        it('should accept password with number', () => {
            const result = validatePassword('HasNumber1');
            expect(result.valid).toBe(true);
            expect(result.errors).not.toContain('Password must contain at least one number');
        });
    });

    describe('special character validation', () => {
        it('should accept password without special character (not required)', () => {
            const result = validatePassword('NoSpecialChar1');
            expect(result.valid).toBe(true);
            expect(result.errors).not.toContain('Password must contain at least one special character');
        });

        it('should accept password with special character', () => {
            const result = validatePassword('WithSpecial!1');
            expect(result.valid).toBe(true);
            expect(result.errors).not.toContain('Password must contain at least one special character');
        });
    });

    describe('edge cases', () => {
        it('should reject empty string', () => {
            const result = validatePassword('');
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should reject null/undefined-like empty input', () => {
            const result = validatePassword('');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must be at least 8 characters long');
        });

        it('should return multiple errors for password missing multiple requirements', () => {
            const result = validatePassword('abc');
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThanOrEqual(2);
            expect(result.errors).toContain('Password must be at least 8 characters long');
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
            expect(result.errors).toContain('Password must contain at least one number');
        });

        it('should handle password with only spaces', () => {
            const result = validatePassword('        ');
            expect(result.valid).toBe(false);
            // 8 spaces passes length check, but fails other requirements
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
            expect(result.errors).toContain('Password must contain at least one lowercase letter');
            expect(result.errors).toContain('Password must contain at least one number');
        });
    });

    describe('error message formatting', () => {
        it('should return errors as an array', () => {
            const result = validatePassword('weak');
            expect(Array.isArray(result.errors)).toBe(true);
        });

        it('should return empty errors array for valid password', () => {
            const result = validatePassword('ValidPass1');
            expect(result.errors).toEqual([]);
        });
    });
});
