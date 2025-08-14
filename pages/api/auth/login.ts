import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from '@src/lib/auth-utils';

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
    const { email, password, role } = req.body;

    // Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email, password, and role are required'
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

    // Validate role
    const validRoles = ['manufacturer', 'pharmacist', 'consumer', 'regulatory', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Please select a valid role'
      });
    }

    // Authenticate user
    const authResult = await authenticateUser(email, password, role);

    if (!authResult.success) {
      // Handle specific error cases
      switch (authResult.error) {
        case 'INVALID_PASSWORD':
          return res.status(401).json({
            error: 'Invalid password',
            message: authResult.message,
            showForgotPassword: true
          });
        
        case 'ROLE_MISMATCH':
          return res.status(403).json({
            error: 'Role mismatch',
            message: authResult.message,
            correctRole: authResult.correctRole
          });
        
        case 'ACCOUNT_DISABLED':
          return res.status(403).json({
            error: 'Account disabled',
            message: authResult.message
          });
        
        default:
          return res.status(500).json({
            error: 'Authentication failed',
            message: authResult.message
          });
      }
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: authResult.message,
      user: authResult.user,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Login API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again.'
    });
  }
}
