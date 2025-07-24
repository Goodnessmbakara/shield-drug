# Next.js Single-Server Architecture

## 🎯 **Why Next.js for Single-Server Architecture?**

This pharmaceutical application uses **Next.js** as a **single-server solution** where both frontend and backend run on the same server. This eliminates the need for separate backend servers and simplifies deployment.

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Frontend      │  │   API Routes    │  │   Database   │ │
│  │   (React)       │  │   (Backend)     │  │   (MongoDB)  │ │
│  │                 │  │                 │  │              │ │
│  │ • Pages         │  │ • /api/uploads  │  │ • Uploads    │ │
│  │ • Components    │  │ • /api/qr-codes │  │ • Users      │ │
│  │ • Styling       │  │ • /api/users    │  │ • QR Codes   │ │
│  │ • State Mgmt    │  │ • /api/auth     │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📁 **Project Structure**

```
shield-drug/
├── pages/                    # Next.js Pages & API Routes
│   ├── api/                  # Backend API Routes (same server)
│   │   ├── uploads/          # Upload management
│   │   ├── qr-codes/         # QR code operations
│   │   ├── users/            # User management
│   │   └── upload-file.ts    # File upload handling
│   ├── manufacturer/         # Frontend pages
│   ├── pharmacist/           # Frontend pages
│   └── consumer/             # Frontend pages
├── src/
│   ├── lib/                  # Shared utilities
│   │   ├── database.ts       # MongoDB connection
│   │   ├── models/           # Database models
│   │   └── db-utils.ts       # Database operations
│   └── components/           # React components
├── public/                   # Static files
│   └── uploads/              # Uploaded files
└── .env.local               # Environment variables
```

## 🔧 **Key Features of Single-Server Architecture**

### **1. API Routes as Backend**
- **Location**: `pages/api/`
- **Purpose**: Handle all backend operations
- **Benefits**: No separate server needed

```typescript
// pages/api/uploads/index.ts
export default async function handler(req, res) {
  // This runs on the same server as your frontend
  const uploads = await getUploadsByUser(userEmail);
  res.json({ uploads });
}
```

### **2. Database Integration**
- **MongoDB**: Direct connection from API routes
- **Models**: Mongoose schemas for data validation
- **Operations**: CRUD operations handled in API routes

### **3. File Uploads**
- **Handled by**: Next.js API routes
- **Storage**: Local filesystem (`public/uploads/`)
- **Processing**: File validation, hashing, database storage

### **4. Authentication**
- **NextAuth.js**: Integrated with Next.js
- **Session Management**: Server-side session handling
- **Role-based Access**: User roles managed in database

## 🌐 **API Endpoints (All on Same Server)**

### **Upload Management**
```
GET    /api/uploads           # Get uploads
POST   /api/uploads           # Create upload
GET    /api/uploads/[id]      # Get specific upload
PUT    /api/uploads/[id]      # Update upload
DELETE /api/uploads/[id]      # Delete upload
```

### **QR Code Operations**
```
GET    /api/qr-codes          # Get QR codes for upload
POST   /api/qr-codes          # Create QR codes
PUT    /api/qr-codes          # Mark as scanned
```

### **File Upload**
```
POST   /api/upload-file       # Upload CSV files
```

### **User Management**
```
GET    /api/users             # Get users
POST   /api/users             # Create user
PUT    /api/users/[id]        # Update user
```

## 🔒 **Security Benefits**

### **1. No CORS Issues**
- Frontend and backend on same origin
- No cross-origin requests needed
- Simplified security configuration

### **2. Shared Authentication**
- Same session management
- No token passing between servers
- Secure cookie-based auth

### **3. Environment Variables**
- All config in one place (`.env.local`)
- No separate backend config
- Easier deployment

## 🚀 **Deployment Advantages**

### **1. Single Deployment**
```bash
# Deploy everything at once
npm run build
npm start
```

### **2. No Server Coordination**
- No need to sync frontend/backend
- No API versioning issues
- Simpler CI/CD pipelines

### **3. Cost Effective**
- Single server instance
- No load balancer needed
- Reduced infrastructure costs

## 📊 **Performance Benefits**

### **1. Reduced Latency**
- No network calls between frontend/backend
- Faster API responses
- Better user experience

### **2. Shared Resources**
- Same memory space
- Shared caching
- Optimized data transfer

### **3. Development Speed**
- Hot reload for both frontend and backend
- Single development server
- Faster debugging

## 🔧 **Environment Configuration**

The `.env.local` file is configured for single-server architecture:

```env
# Next.js Application Configuration
# This is a single-server application using Next.js API routes as backend

# Database Configuration
DATABASE_URL="mongodb+srv://username:password@cluster0.mongodb.net/shield-drug"

# Next.js Environment
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Next.js API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api

# File Upload (handled by Next.js API routes)
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./public/uploads

# Blockchain Integration
POLYGON_RPC_URL=https://polygon-mumbai.infura.io/v3/your-infura-project-id
POLYGON_CHAIN_ID=80001
```

## 🎯 **Why This Approach for Pharmaceuticals?**

### **1. Regulatory Compliance**
- All data stays on one server
- Easier audit trails
- Simplified security controls

### **2. Data Integrity**
- No data transfer between servers
- Atomic operations
- Consistent state management

### **3. Scalability**
- Can still scale horizontally
- Load balancing at edge
- Microservices can be added later

## 🔄 **Migration Path**

If you need to scale later:

1. **Keep Next.js API routes** for simple operations
2. **Add microservices** for complex operations
3. **Use API Gateway** for routing
4. **Maintain single deployment** for frontend

## 📈 **Monitoring & Debugging**

### **1. Single Log Stream**
- All logs in one place
- Easier debugging
- Unified monitoring

### **2. Performance Metrics**
- Single application metrics
- No distributed tracing needed
- Simpler profiling

### **3. Error Handling**
- Centralized error handling
- Consistent error responses
- Easier troubleshooting

This architecture provides a **robust, scalable, and maintainable** solution for pharmaceutical data management while keeping the simplicity of a single-server deployment. 