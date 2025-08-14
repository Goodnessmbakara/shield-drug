import { NextApiRequest, NextApiResponse } from 'next';
import { auditLogger } from './audit-logger';

export interface AuditMiddlewareOptions {
  enabled?: boolean;
  logRequestBody?: boolean;
  logResponseBody?: boolean;
  excludePaths?: string[];
  includePaths?: string[];
}

export function withAuditLogging(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: AuditMiddlewareOptions = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const {
      enabled = true,
      logRequestBody = false,
      logResponseBody = false,
      excludePaths = [],
      includePaths = []
    } = options;

    // Skip audit logging if disabled
    if (!enabled) {
      return handler(req, res);
    }

    // Check if path should be excluded
    const path = req.url || '';
    if (excludePaths.some(excludePath => path.includes(excludePath))) {
      return handler(req, res);
    }

    // Check if path should be included (if includePaths is specified)
    if (includePaths.length > 0 && !includePaths.some(includePath => path.includes(includePath))) {
      return handler(req, res);
    }

    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userEmail = req.headers['x-user-email'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const ipAddress = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] as string;

    // Add requestId to headers for downstream use
    req.headers['x-request-id'] = requestId;

    // Capture original send method
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;

    let responseBody: any = null;
    let responseSent = false;

    // Override response methods to capture response data
    res.send = function(body: any) {
      if (!responseSent) {
        responseBody = body;
        responseSent = true;
      }
      return originalSend.call(this, body);
    };

    res.json = function(body: any) {
      if (!responseSent) {
        responseBody = body;
        responseSent = true;
      }
      return originalJson.call(this, body);
    };

    res.end = function(chunk?: any, encoding?: any, cb?: any) {
      if (!responseSent && chunk) {
        responseBody = chunk;
        responseSent = true;
      }
      return originalEnd.call(this, chunk, encoding, cb);
    };

    try {
      // Log API call start
      await auditLogger.logApiCall({
        action: `${req.method} ${req.url}`,
        description: `API call to ${req.url}`,
        userEmail,
        userRole,
        ipAddress,
        userAgent,
        requestId,
        endpoint: req.url || '',
        method: req.method || 'GET',
        statusCode: 200, // Will be updated after response
        responseTime: 0, // Will be updated after response
        metadata: {
          query: req.query,
          headers: logRequestBody ? req.headers : undefined,
          body: logRequestBody ? req.body : undefined
        }
      });

      // Call the original handler
      await handler(req, res);

      // Log successful API call
      const responseTime = Date.now() - startTime;
      await auditLogger.logApiCall({
        action: `${req.method} ${req.url}`,
        description: `API call completed successfully`,
        userEmail,
        userRole,
        ipAddress,
        userAgent,
        requestId,
        endpoint: req.url || '',
        method: req.method || 'GET',
        statusCode: res.statusCode,
        responseTime,
        metadata: {
          responseBody: logResponseBody ? responseBody : undefined,
          responseHeaders: logResponseBody ? res.getHeaders() : undefined
        }
      });

    } catch (error) {
      // Log failed API call
      const responseTime = Date.now() - startTime;
      await auditLogger.logApiCall({
        action: `${req.method} ${req.url}`,
        description: `API call failed`,
        userEmail,
        userRole,
        ipAddress,
        userAgent,
        requestId,
        endpoint: req.url || '',
        method: req.method || 'GET',
        statusCode: res.statusCode || 500,
        responseTime,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          stackTrace: error instanceof Error ? error.stack : undefined
        }
      });

      // Re-throw the error
      throw error;
    }
  };
}

// Helper function to get client IP address
export function getClientIP(req: NextApiRequest): string {
  return (
    (req.headers['x-forwarded-for'] as string) ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

// Helper function to extract user info from request
export function getUserInfo(req: NextApiRequest): {
  userEmail?: string;
  userRole?: string;
  requestId: string;
} {
  const userEmail = req.headers['x-user-email'] as string;
  const userRole = req.headers['x-user-role'] as string;
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return { userEmail, userRole, requestId };
}
