import bcrypt from 'bcryptjs';
import { IUser } from './models/User';
import { getUserByEmail, createUser, updateUserLastLogin } from './db-utils';

// Password hashing and verification
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Authentication functions
export const authenticateUser = async (email: string, password: string, selectedRole: string) => {
  try {
    // Find user by email
    const user = await getUserByEmail(email);
    
    if (!user) {
      // User doesn't exist - create new user
      const hashedPassword = await hashPassword(password);
      const newUser = await createUser({
        email,
        password: hashedPassword,
        role: selectedRole as any,
        isActive: true,
        isVerified: false
      });
      
      // Update last login
      await updateUserLastLogin(email);
      
      return {
        success: true,
        user: {
          email: newUser.email,
          role: newUser.role,
          isActive: newUser.isActive,
          isVerified: newUser.isVerified
        },
        message: 'New user created successfully'
      };
    }
    
    // User exists - verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'INVALID_PASSWORD',
        message: 'Invalid password. Please try again or use forgot password.'
      };
    }
    
    // Check if user is active
    if (!user.isActive) {
      return {
        success: false,
        error: 'ACCOUNT_DISABLED',
        message: 'Account is disabled. Please contact support.'
      };
    }
    
    // Check if selected role matches user's role
    if (user.role !== selectedRole) {
      return {
        success: false,
        error: 'ROLE_MISMATCH',
        message: `Please select the correct role: ${user.role}`,
        correctRole: user.role
      };
    }
    
    // Update last login
    await updateUserLastLogin(email);
    
    return {
      success: true,
      user: {
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
        companyName: user.companyName,
        nafdacLicenseNumber: user.nafdacLicenseNumber
      },
      message: 'Login successful'
    };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'AUTHENTICATION_ERROR',
      message: 'Authentication failed. Please try again.'
    };
  }
};

// Password reset function (simplified - no email verification for now)
export const resetPassword = async (email: string, newPassword: string) => {
  try {
    const user = await getUserByEmail(email);
    
    if (!user) {
      return {
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found with this email address.'
      };
    }
    
    const hashedPassword = await hashPassword(newPassword);
    
    // Update password in database
    const updatedUser = await updateUserPassword(email, hashedPassword);
    
    return {
      success: true,
      message: 'Password updated successfully'
    };
    
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: 'PASSWORD_RESET_ERROR',
      message: 'Failed to reset password. Please try again.'
    };
  }
};

// Helper function to update user password
const updateUserPassword = async (email: string, hashedPassword: string) => {
  const { default: User } = await import('./models/User');
  const dbConnect = (await import('./database')).default;
  
  await dbConnect();
  return await User.findOneAndUpdate(
    { email },
    { password: hashedPassword },
    { new: true }
  );
};
