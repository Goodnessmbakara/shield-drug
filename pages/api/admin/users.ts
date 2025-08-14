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
    case 'GET':
      return handleGetUsers(req, res);
    case 'POST':
      return handleCreateUser(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

async function handleGetUsers(req: NextApiRequest, res: NextApiResponse) {

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

    // Get query parameters
    const { 
      page = '1', 
      limit = '50', 
      search = '', 
      role = 'all', 
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    if (role !== 'all') {
      filter.role = role;
    }

    if (status !== 'all') {
      if (status === 'active') {
        filter.isActive = true;
      } else if (status === 'inactive') {
        filter.isActive = false;
      }
    }

    // Build sort conditions
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Get users with pagination
    const users = await User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select('-password') // Exclude password field
      .lean();

    // Get total count for pagination
    const totalUsers = await User.countDocuments(filter);

    // Get role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get status distribution
    const statusDistribution = await User.aggregate([
      {
        $group: {
          _id: '$isActive',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get verification status distribution
    const verificationDistribution = await User.aggregate([
      {
        $group: {
          _id: '$isVerified',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Format users for frontend
    const formattedUsers = users.map(user => ({
      id: (user._id as mongoose.Types.ObjectId).toString(),
      name: user.email.split('@')[0], // Use email prefix as name
      email: user.email,
      role: user.role,
      status: user.isActive ? 'active' : 'inactive',
      lastLogin: user.lastLogin ? 
        new Date(user.lastLogin).toLocaleString() : 
        'Never',
      registered: new Date(user.createdAt).toLocaleDateString(),
      organization: user.companyName || 'Individual',
      isVerified: user.isVerified,
      address: user.address,
      phone: user.phone,
      nafdacLicenseNumber: user.nafdacLicenseNumber
    }));

    res.status(200).json({
      users: formattedUsers,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalUsers,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      },
      stats: {
        roleDistribution: roleDistribution.reduce((acc, role) => {
          acc[role._id] = role.count;
          return acc;
        }, {} as Record<string, number>),
        statusDistribution: statusDistribution.reduce((acc, status) => {
          acc[status._id ? 'active' : 'inactive'] = status.count;
          return acc;
        }, {} as Record<string, number>),
        verificationDistribution: verificationDistribution.reduce((acc, verified) => {
          acc[verified._id ? 'verified' : 'unverified'] = verified.count;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error('Error fetching admin users data:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching users data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleCreateUser(req: NextApiRequest, res: NextApiResponse) {
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

    // Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      email,
      password: hashedPassword,
      role,
      companyName: companyName || '',
      address: address || '',
      phone: phone || '',
      nafdacLicenseNumber: nafdacLicenseNumber || '',
      isActive: isActive !== undefined ? isActive : true,
      isVerified: isVerified !== undefined ? isVerified : false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newUser.save();

    // Return success without password
    const userResponse = {
      id: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      companyName: newUser.companyName,
      address: newUser.address,
      phone: newUser.phone,
      nafdacLicenseNumber: newUser.nafdacLicenseNumber,
      isActive: newUser.isActive,
      isVerified: newUser.isVerified,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      error: 'Internal server error while creating user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
