# 🚀 Kulfy Setup Guide

This guide will help you get Kulfy running locally with MongoDB Atlas and Pinata IPFS.

## Prerequisites

- Node.js 18 or higher
- npm or pnpm
- MongoDB Atlas account (free tier works)
- Pinata account (free tier works)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up MongoDB Atlas

1. **Create a MongoDB Atlas Account**
   - Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account

2. **Create a Cluster**
   - Click "Build a Database"
   - Choose the FREE tier (M0)
   - Select your preferred cloud provider and region
   - Name your cluster (e.g., "kulfycluster")

3. **Create a Database User**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication method
   - Enter a username and secure password
   - Set "Database User Privileges" to "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development, click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production, add specific IP addresses
   - Click "Confirm"

5. **Get Your Connection String**
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `kulfy` (or your preferred database name)

Example connection string:
```
mongodb+srv://username:password@kulfycluster.et4uacl.mongodb.net/kulfy?retryWrites=true&w=majority
```

### 3. Set Up Pinata

1. **Create a Pinata Account**
   - Go to [https://www.pinata.cloud/](https://www.pinata.cloud/)
   - Sign up for a free account

2. **Generate an API Key**
   - Go to "Developers" → "API Keys" in the navigation
   - Click "New Key"
   - Enable the following permissions:
     - `pinFileToIPFS`
     - `pinJSONToIPFS`
     - Or just select "Admin" for all permissions
   - Give your key a name (e.g., "Kulfy Dev")
   - Click "Create Key"
   - **IMPORTANT**: Copy the JWT token immediately - you won't be able to see it again!

3. **Get Your Dedicated Gateway**
   - Go to "Gateways" in the navigation
   - Your dedicated gateway URL will be displayed
   - It should look like: `yourname.mypinata.cloud`
   - Copy this URL (without `https://`)

### 4. Configure Environment Variables

1. **Copy the environment template**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` with your actual credentials**
   ```env
   MONGODB_URI=mongodb+srv://username:password@kulfycluster.et4uacl.mongodb.net/kulfy?retryWrites=true&w=majority
   PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your_actual_jwt_here
   PINATA_GATEWAY=yourname.mypinata.cloud
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing the Application

### 1. Upload a Test Image

1. Navigate to http://localhost:3000/upload
2. Enter an optional title
3. Select an image file (PNG, JPEG, WebP, or GIF - max 6MB)
4. Click "Upload to IPFS"
5. You should see a success message with a CID

### 2. Run the Moderation Agent

The agent processes pending posts and approves them. You can trigger it manually:

**Option A: Via Browser**
```
http://localhost:3000/api/agent/run
```

**Option B: Via Terminal**
```bash
curl http://localhost:3000/api/agent/run
```

You should see a JSON response:
```json
{
  "ok": true,
  "processed": 1,
  "message": "Successfully processed 1 post(s)"
}
```

### 3. View the Feed

1. Navigate to http://localhost:3000/feed
2. You should see your approved image(s) displayed in a grid

## Common Issues

### "MongoDB connection failed"

- Verify your connection string is correct
- Check that your IP address is whitelisted in MongoDB Atlas Network Access
- Ensure your database user credentials are correct
- Make sure the database name in the connection string matches

### "Pinata upload failed"

- Verify your JWT token is correct and has the right permissions
- Check that your file is under 6MB
- Ensure the file format is supported (PNG, JPEG, WebP, GIF)
- Verify your Pinata account has available storage

### "Cannot find module" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build fails with TypeScript errors

```bash
# Clear Next.js cache and rebuild
rm -rf .next
npm run build
```

### ESLint circular structure warning

This is a known issue with Next.js 15.0.0 and doesn't affect functionality. The build will complete successfully despite this warning.

## Production Deployment (Vercel)

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Click "Import Project"
3. Import your GitHub repository
4. Configure your environment variables:
   - `MONGODB_URI`
   - `PINATA_JWT`
   - `PINATA_GATEWAY`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel domain)
5. Click "Deploy"

### 3. Test Production

After deployment:
1. Visit your Vercel URL
2. Test the upload functionality
3. Manually trigger the agent at `your-domain.vercel.app/api/agent/run`
4. Check the feed

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Need Help?

- Check the main [README.md](./README.md) for more information
- Review the [troubleshooting section](#common-issues) above
- Check MongoDB Atlas and Pinata documentation
- Open an issue on GitHub

---

Happy memeing! 🍦

