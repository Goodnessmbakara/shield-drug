import { NextApiRequest, NextApiResponse } from 'next';
import { resetPassword } from '@src/lib/auth-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  try {
    const { email, newPassword } = req.body;

    // Validate required fields
    if (!email || !newPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and new password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        message: 'Please enter a valid email address'
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Weak password',
        message: 'Password must be at least 6 characters long'
      });
    }

    // Reset password
    const resetResult = await resetPassword(email, newPassword);

    if (!resetResult.success) {
      return res.status(400).json({
        error: resetResult.error,
        message: resetResult.message
      });
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: resetResult.message,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Forgot password API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again.'
    });
  }
}
