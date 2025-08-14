import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/database';
import SystemSetting from '@/lib/models/SystemSetting';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  switch (req.method) {
    case 'GET':
      return handleGetSettings(req, res);
    case 'POST':
      return handleUpdateSettings(req, res, userEmail as string);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

async function handleGetSettings(req: NextApiRequest, res: NextApiResponse) {
  try {
    const settings = await SystemSetting.find().lean();
    
    // Group settings by category
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {};
      }
      acc[setting.category][setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);

    res.status(200).json(groupedSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleUpdateSettings(req: NextApiRequest, res: NextApiResponse, userEmail: string) {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object is required' });
    }

    const updates = [];
    const settingDescriptions = {
      'siteName': 'The name of the application',
      'maintenanceMode': 'Enable maintenance mode to temporarily disable the system',
      'debugMode': 'Enable debug mode for detailed error logging',
      'auditLogging': 'Enable audit logging for all user actions',
      'rateLimiting': 'Enable rate limiting for API requests',
      'blockchainNetwork': 'The blockchain network to use for drug verification',
      'contractAddress': 'The smart contract address for drug verification',
      'emailNotifications': 'Enable email notifications for reports and alerts',
      'reportAlerts': 'Enable notifications for new drug reports'
    };

    for (const [category, categorySettings] of Object.entries(settings)) {
      for (const [key, value] of Object.entries(categorySettings as any)) {
        const description = settingDescriptions[key as keyof typeof settingDescriptions] || `Setting for ${key}`;
        
        updates.push(
          SystemSetting.findOneAndUpdate(
            { key },
            {
              key,
              value,
              category: category as any,
              description,
              updatedBy: userEmail,
              updatedAt: new Date()
            },
            { upsert: true, new: true }
          )
        );
      }
    }

    await Promise.all(updates);

    res.status(200).json({
      message: 'Settings updated successfully',
      updatedBy: userEmail,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ 
      error: 'Internal server error while updating settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
