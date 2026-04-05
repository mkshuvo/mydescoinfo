import { createNeonAuth } from '@neondatabase/auth/next/server';

/**
 * Password validation configuration
 *
 * Note: This configuration is used for client-side validation in sign-up forms.
 * The Neon Auth provider handles server-side password validation internally.
 * These settings should match the auth provider's requirements.
 */
export const PASSWORD_CONFIG = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: false,
};

/**
 * Validates password strength according to security best practices
 *
 * @param password - The password to validate
 * @returns Object with validation result and any error messages
 *
 * @example
 * const result = validatePassword('MyPass123');
 * if (!result.valid) {
 *     console.log(result.errors); // Array of validation failures
 * }
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
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

export const auth = createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL!,
    cookies: {
        secret: process.env.NEON_AUTH_COOKIE_SECRET!,
    },
});
