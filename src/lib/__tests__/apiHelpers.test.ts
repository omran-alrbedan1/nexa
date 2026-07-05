import { describe, it, expect } from 'vitest';
import { extractErrorMessage, extractValidationErrors, unwrap, safeFetch } from '../apiHelpers';

describe('extractErrorMessage', () => {
  it('returns message from Axios-style error response', () => {
    const error = { response: { data: { message: 'Invalid credentials' } } };
    expect(extractErrorMessage(error)).toBe('Invalid credentials');
  });

  it('returns first validation error when no message', () => {
    const error = { response: { data: { errors: { email: ['The email field is required.'] } } } };
    expect(extractErrorMessage(error)).toBe('The email field is required.');
  });

  it('returns first field error from multiple', () => {
    const error = {
      response: {
        data: {
          errors: {
            email: ['Email is required.'],
            password: ['Password is too short.'],
          },
        },
      },
    };
    expect(extractErrorMessage(error)).toBe('Email is required.');
  });

  it('returns Error.message for standard errors', () => {
    expect(extractErrorMessage(new Error('Something broke'))).toBe('Something broke');
  });

  it('returns fallback for unknown errors', () => {
    expect(extractErrorMessage(null)).toBe('An unexpected error occurred');
    expect(extractErrorMessage('just a string')).toBe('An unexpected error occurred');
    expect(extractErrorMessage(42)).toBe('An unexpected error occurred');
  });
});

describe('extractValidationErrors', () => {
  it('extracts field errors from Axios response', () => {
    const error = {
      response: {
        data: {
          errors: {
            email: ['Email is required.'],
            password: ['Password is too short.', 'Must be 8+ characters.'],
          },
        },
      },
    };
    expect(extractValidationErrors(error)).toEqual({
      email: 'Email is required.',
      password: 'Password is too short.',
    });
  });

  it('returns null when no errors field present', () => {
    expect(extractValidationErrors({})).toBeNull();
    expect(extractValidationErrors(null)).toBeNull();
    expect(extractValidationErrors(new Error('nope'))).toBeNull();
  });
});

describe('unwrap', () => {
  it('extracts data from API response envelope', () => {
    expect(unwrap({ success: true, message: 'OK', data: { id: 1 } })).toEqual({ id: 1 });
  });
});

describe('safeFetch', () => {
  it('returns result on success', async () => {
    await expect(safeFetch(() => Promise.resolve('data'), null)).resolves.toBe('data');
  });

  it('returns fallback on rejection', async () => {
    await expect(safeFetch(() => Promise.reject(new Error('fail')), null)).resolves.toBeNull();
  });
});
