# MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create an account
3. Choose the "Free" tier (M0)

## Step 2: Create a Cluster

1. Click "Build a Database"
2. Choose "FREE" tier (M0)
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region close to you
5. Click "Create"

## Step 3: Set Up Database Access

1. In the left sidebar, click "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and password (save these!)
5. Select "Read and write to any database"
6. Click "Add User"

## Step 4: Set Up Network Access

1. In the left sidebar, click "Network Access"
2. Click "Add IP Address"
3. For development, click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

## Step 5: Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Select "Node.js" and version "5.0 or later"
4. Copy the connection string

## Step 6: Update Environment Variables

1. Open `.env.local` in your project
2. Replace the `DATABASE_URL` with your actual connection string:

```env
DATABASE_URL="mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/shield-drug?retryWrites=true&w=majority"
```

Replace:
- `your-username` with your database username
- `your-password` with your database password
- `cluster0.xxxxx.mongodb.net` with your actual cluster URL
- `shield-drug` is the database name (you can change this)

## Step 7: Test Connection

1. Start your development server: `npm run dev`
2. Visit: `http://localhost:3001/api/test-db`
3. You should see: `{"message":"Database connection successful!"}`

## Security Notes

- Never commit your `.env.local` file to version control
- Use strong passwords for database users
- In production, restrict IP access to your server's IP address
- Consider using MongoDB Atlas VPC peering for enhanced security

## Database Collections

The application will automatically create these collections:
- `uploads` - Store upload records
- `users` - Store user accounts
- `qrcodes` - Store QR code data

## Troubleshooting

### Connection Error
- Check your username and password
- Verify your IP is whitelisted
- Ensure the cluster is running

### Authentication Error
- Make sure you're using the correct database username
- Check that the user has read/write permissions

### Network Error
- Verify your IP address is in the Network Access list
- Try connecting from a different network 