import AuditLog, { IAuditLog } from './models/AuditLog';
import dbConnect from './database';

export interface AuditLogData {
  level?: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  category: 'API_CALL' | 'USER_ACTION' | 'SYSTEM_EVENT' | 'SECURITY' | 'BLOCKCHAIN' | 'DATABASE';
  action: string;
  description: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, any>;
  error?: string;
  stackTrace?: string;
}

export class AuditLogger {
  private static instance: AuditLogger;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  private async ensureConnection() {
    if (!this.isConnected) {
      await dbConnect();
      this.isConnected = true;
    }
  }

  /**
   * Log an audit event to the database
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await this.ensureConnection();
      
      const auditLog = new AuditLog({
        timestamp: new Date(),
        level: data.level || 'INFO',
        ...data
      });

      await auditLog.save();
    } catch (error) {
      // Don't throw errors from audit logging to avoid breaking main functionality
      console.error('Audit logging failed:', error);
    }
  }

  /**
   * Log API call
   */
  async logApiCall(data: {
    action: string;
    description: string;
    userEmail?: string;
    userRole?: string;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    metadata?: Record<string, any>;
    error?: string;
  }): Promise<void> {
    await this.log({
      category: 'API_CALL',
      ...data
    });
  }

  /**
   * Log user action
   */
  async logUserAction(data: {
    action: string;
    description: string;
    userEmail: string;
    userRole: string;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    resourceId?: string;
    resourceType?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.log({
      category: 'USER_ACTION',
      level: 'INFO',
      ...data
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(data: {
    action: string;
    description: string;
    userEmail?: string;
    userRole?: string;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    level?: 'WARN' | 'ERROR';
    metadata?: Record<string, any>;
    error?: string;
  }): Promise<void> {
    await this.log({
      category: 'SECURITY',
      level: data.level || 'WARN',
      ...data
    });
  }

  /**
   * Log system event
   */
  async logSystemEvent(data: {
    action: string;
    description: string;
    level?: 'INFO' | 'WARN' | 'ERROR';
    metadata?: Record<string, any>;
    error?: string;
  }): Promise<void> {
    await this.log({
      category: 'SYSTEM_EVENT',
      level: data.level || 'INFO',
      ...data
    });
  }

  /**
   * Log blockchain event
   */
  async logBlockchainEvent(data: {
    action: string;
    description: string;
    userEmail?: string;
    userRole?: string;
    requestId?: string;
    resourceId?: string;
    resourceType?: string;
    level?: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    metadata?: Record<string, any>;
    error?: string;
  }): Promise<void> {
    await this.log({
      category: 'BLOCKCHAIN',
      level: data.level || 'INFO',
      ...data
    });
  }

  /**
   * Log database event
   */
  async logDatabaseEvent(data: {
    action: string;
    description: string;
    userEmail?: string;
    userRole?: string;
    requestId?: string;
    resourceId?: string;
    resourceType?: string;
    metadata?: Record<string, any>;
    error?: string;
  }): Promise<void> {
    await this.log({
      category: 'DATABASE',
      level: 'INFO',
      ...data
    });
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filters: {
    category?: string;
    level?: string;
    userEmail?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    skip?: number;
  } = {}): Promise<{ logs: any[]; total: number }> {
    await this.ensureConnection();

    const query: any = {};

    if (filters.category) query.category = filters.category;
    if (filters.level) query.level = filters.level;
    if (filters.userEmail) query.userEmail = filters.userEmail;
    if (filters.action) query.action = { $regex: filters.action, $options: 'i' };
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = filters.startDate;
      if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(filters.skip || 0)
        .limit(filters.limit || 100)
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    return { logs, total };
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    totalLogs: number;
    apiCalls: number;
    userActions: number;
    securityEvents: number;
    systemEvents: number;
    blockchainEvents: number;
    databaseEvents: number;
    errors: number;
    warnings: number;
  }> {
    await this.ensureConnection();

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const stats = await AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          apiCalls: { $sum: { $cond: [{ $eq: ['$category', 'API_CALL'] }, 1, 0] } },
          userActions: { $sum: { $cond: [{ $eq: ['$category', 'USER_ACTION'] }, 1, 0] } },
          securityEvents: { $sum: { $cond: [{ $eq: ['$category', 'SECURITY'] }, 1, 0] } },
          systemEvents: { $sum: { $cond: [{ $eq: ['$category', 'SYSTEM_EVENT'] }, 1, 0] } },
          blockchainEvents: { $sum: { $cond: [{ $eq: ['$category', 'BLOCKCHAIN'] }, 1, 0] } },
          databaseEvents: { $sum: { $cond: [{ $eq: ['$category', 'DATABASE'] }, 1, 0] } },
          errors: { $sum: { $cond: [{ $eq: ['$level', 'ERROR'] }, 1, 0] } },
          warnings: { $sum: { $cond: [{ $eq: ['$level', 'WARN'] }, 1, 0] } }
        }
      }
    ]);

    return stats[0] || {
      totalLogs: 0,
      apiCalls: 0,
      userActions: 0,
      securityEvents: 0,
      systemEvents: 0,
      blockchainEvents: 0,
      databaseEvents: 0,
      errors: 0,
      warnings: 0
    };
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();
