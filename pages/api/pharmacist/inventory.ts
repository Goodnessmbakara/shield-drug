import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/database';
import QRCode from '@/lib/models/QRCode';
import Verification from '@/lib/models/Verification';
import mongoose from 'mongoose';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const userRole = req.headers['x-user-role'];
    const userEmail = req.headers['x-user-email'];
    
    if (userRole !== 'pharmacist') {
      return res.status(403).json({ error: 'Access denied. Pharmacist role required.' });
    }

    if (!userEmail) {
      return res.status(401).json({ error: 'User email required' });
    }

    await dbConnect();

    // Handle POST request for adding new inventory item
    if (req.method === 'POST') {
      const {
        drugName,
        genericName,
        batchId,
        manufacturer,
        quantity,
        unit,
        category,
        expiryDate,
        location,
        supplier,
        purchaseDate
      } = req.body;

      // Validate required fields
      if (!drugName || !batchId || !manufacturer || !quantity) {
        return res.status(400).json({
          error: 'Missing required fields: drugName, batchId, manufacturer, quantity are required'
        });
      }

      // Check if batch ID already exists
      const existingBatch = await QRCode.findOne({ 
        'metadata.batchId': batchId,
        userEmail: userEmail as string
      });

      if (existingBatch) {
        return res.status(400).json({
          error: 'Batch ID already exists in your inventory'
        });
      }

      // Generate unique QR code ID
      const crypto = require('crypto');
      const timestamp = Date.now();
      const randomBytes = crypto.randomBytes(6);
      const qrCodeId = `QR-${randomBytes.toString('hex').toUpperCase()}`;

      // Create verification URL
      const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify/${qrCodeId}`;

      // Create QR code entry
      const qrCodeData = {
        qrCodeId,
        uploadId: `manual-${timestamp}`, // Manual upload ID for pharmacist-added items
        userEmail: userEmail as string,
        drugCode: drugName.toLowerCase().replace(/\s+/g, '-'),
        serialNumber: 1,
        verificationUrl,
        metadata: {
          drugName,
          batchId,
          manufacturer,
          expiryDate: expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 1 year from now
          quantity: parseInt(quantity.toString())
        },
        status: 'generated',
        isScanned: false
      };

      // Add additional metadata if provided
      if (genericName) qrCodeData.metadata.genericName = genericName;
      if (unit) qrCodeData.metadata.unit = unit;
      if (category) qrCodeData.metadata.category = category;
      if (location) qrCodeData.metadata.location = location;
      if (supplier) qrCodeData.metadata.supplier = supplier;
      if (purchaseDate) qrCodeData.metadata.purchaseDate = purchaseDate;

      const newQRCode = new QRCode(qrCodeData);
      await newQRCode.save();

      return res.status(201).json({
        success: true,
        message: 'Inventory item added successfully',
        qrCode: {
          id: newQRCode._id,
          qrCodeId: newQRCode.qrCodeId,
          drugName: newQRCode.metadata.drugName,
          batchId: newQRCode.metadata.batchId,
          manufacturer: newQRCode.metadata.manufacturer,
          verificationUrl: newQRCode.verificationUrl,
          status: newQRCode.status
        }
      });
    }

    // Get query parameters
    const { 
      search = '', 
      category = 'all', 
      status = 'all',
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    const filter: any = { userEmail: userEmail as string };
    
    if (search) {
      filter.$or = [
        { 'metadata.drugName': { $regex: search, $options: 'i' } },
        { 'metadata.batchId': { $regex: search, $options: 'i' } },
        { 'metadata.manufacturer': { $regex: search, $options: 'i' } }
      ];
    }

    if (category !== 'all') {
      filter['metadata.category'] = category;
    }

    // Get QR codes (inventory items)
    const qrCodes = await QRCode.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const totalQRCodes = await QRCode.countDocuments(filter);

    // Get statistics
    const stats = await getInventoryStats(userEmail as string);

    // Get unique categories for filter dropdown
    const categories = await QRCode.distinct('metadata.category', { userEmail: userEmail as string });

    // Calculate pagination info
    const totalPages = Math.ceil(totalQRCodes / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Format inventory items
    const inventoryItems = await Promise.all(qrCodes.map(async (qrCode) => {
      // Get verification count for this QR code
      const verificationCount = await Verification.countDocuments({
        qrCodeId: qrCode.qrCodeId
      });

      // Get latest verification
      const latestVerification = await Verification.findOne({
        qrCodeId: qrCode.qrCodeId
      }).sort({ createdAt: -1 }).lean();

      // Determine status based on expiry date and scan status
      const now = new Date();
      const expiryDate = qrCode.metadata?.expiryDate ? new Date(qrCode.metadata.expiryDate) : null;
      const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

      let status = 'active';
      if (!qrCode.isScanned) {
        status = 'pending-verification';
      } else if (expiryDate && daysUntilExpiry !== null && daysUntilExpiry <= 0) {
        status = 'expired';
      } else if (expiryDate && daysUntilExpiry !== null && daysUntilExpiry <= 30) {
        status = 'expiring';
      }

      return {
        id: (qrCode._id as any).toString(),
        drugName: qrCode.metadata?.drugName || 'Unknown Drug',
        genericName: qrCode.metadata?.genericName || 'Unknown',
        category: qrCode.metadata?.category || 'Other',
        quantity: 1, // Each QR code represents one unit
        unit: qrCode.metadata?.unit || 'unit',
        expiryDate: qrCode.metadata?.expiryDate || null,
        batchId: qrCode.metadata?.batchId || 'N/A',
        manufacturer: qrCode.metadata?.manufacturer || 'Unknown',
        supplier: qrCode.metadata?.supplier || 'Unknown',
        purchaseDate: qrCode.createdAt,
        status: status,
        verificationStatus: qrCode.isScanned ? 'verified' : 'pending',
        lastVerified: (latestVerification as any)?.createdAt || null,
        verificationCount: verificationCount,
        location: qrCode.metadata?.location || 'Unknown',
        reorderLevel: 1,
        minStock: 1,
        qrCodeId: qrCode.qrCodeId,
        isScanned: qrCode.isScanned,
        scannedAt: qrCode.scannedAt,
        scannedBy: qrCode.scannedBy
      };
    }));

    res.status(200).json({
      success: true,
      inventoryItems,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalQRCodes,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      },
      stats,
      filters: {
        categories: categories.filter(Boolean) // Remove null/undefined values
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Pharmacist inventory API error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching inventory data' 
    });
  }
}

async function getInventoryStats(userEmail: string) {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Get QR code statistics
  const [
    totalQRCodes,
    scannedQRCodes,
    unscannedQRCodes,
    expiringQRCodes,
    expiredQRCodes
  ] = await Promise.all([
    QRCode.countDocuments({ userEmail }),
    QRCode.countDocuments({ userEmail, isScanned: true }),
    QRCode.countDocuments({ userEmail, isScanned: false }),
    QRCode.countDocuments({ 
      userEmail, 
      'metadata.expiryDate': { $lte: thirtyDaysFromNow, $gt: now }
    }),
    QRCode.countDocuments({ 
      userEmail, 
      'metadata.expiryDate': { $lte: now }
    })
  ]);

  // Get verification statistics
  const totalVerifications = await Verification.countDocuments({ userEmail });

  // Calculate percentages
  const verificationRate = totalQRCodes > 0 
    ? Math.round((scannedQRCodes / totalQRCodes) * 100 * 10) / 10
    : 0;

  return {
    totalItems: totalQRCodes,
    activeItems: scannedQRCodes,
    lowStockItems: unscannedQRCodes,
    outOfStockItems: 0, // Not applicable for QR code-based inventory
    expiringItems: expiringQRCodes,
    verifiedItems: scannedQRCodes,
    pendingVerification: unscannedQRCodes,
    totalValue: totalQRCodes * 1000, // Mock value calculation
    monthlySales: totalVerifications * 500, // Mock sales calculation
    verificationRate
  };
}
