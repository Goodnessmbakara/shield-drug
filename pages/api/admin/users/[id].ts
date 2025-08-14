import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/database';
import User from '@/lib/models/User';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'PUT':
      return handleUpdateUser(req, res);
    case 'DELETE':
      return handleDeleteUser(req, res);
    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

async function handleUpdateUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check authentication
    const userRole = req.headers['x-user-role'];
    const userEmail = req.headers['x-user-email'];
    
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    if (!userEmail) {
      return res.status(401).json({ error: 'User email required' });
    }

    await dbConnect();

    const { id } = req.query;
    const { 
      email, 
      password, 
      role, 
      companyName, 
      address, 
      phone, 
      nafdacLicenseNumber,
      isActive,
      isVerified
    } = req.body;

    // Validate user ID
    if (!id || !mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }
    }

    // Update user fields
    if (email) user.email = email;
    if (role) user.role = role;
    if (companyName !== undefined) user.companyName = companyName;
    if (address !== undefined) user.address = address;
    if (phone !== undefined) user.phone = phone;
    if (nafdacLicenseNumber !== undefined) user.nafdacLicenseNumber = nafdacLicenseNumber;
    if (isActive !== undefined) user.isActive = isActive;
    if (isVerified !== undefined) user.isVerified = isVerified;

    // Update password if provided
    if (password && password.trim() !== '') {
      const saltRounds = 12;
      user.password = await bcrypt.hash(password, saltRounds);
    }

    user.updatedAt = new Date();
    await user.save();

    // Return success without password
    const userResponse = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      companyName: user.companyName,
      address: user.address,
      phone: user.phone,
      nafdacLicenseNumber: user.nafdacLicenseNumber,
      isActive: user.isActive,
      isVerified: user.isVerified,
      updatedAt: user.updatedAt
    };

    res.status(200).json({
      message: 'User updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      error: 'Internal server error while updating user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleDeleteUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check authentication
    const userRole = req.headers['x-user-role'];
    const userEmail = req.headers['x-user-email'];
    
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    if (!userEmail) {
      return res.status(401).json({ error: 'User email required' });
    }

    await dbConnect();

    const { id } = req.query;

    // Validate user ID
    if (!id || !mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Find and delete user
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      message: 'User deleted successfully',
      deletedUserId: id
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      error: 'Internal server error while deleting user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
