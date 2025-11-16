# Environment Variables Setup Guide

This guide explains how to set up the `.env` file for the Kulfy MCP Server.

## Required Environment Variables

The MCP server needs the following 3 environment variables:

### 1. MONGODB_URI

**What it is:** MongoDB connection string for your database

**How to get it:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign in or create an account
3. Create a cluster (or use existing)
4. Click "Connect" on your cluster
5. Choose "Connect your application"
6. Copy the connection string
7. Replace `<password>` with your database user password
8. Replace `<dbname>` with `kulfy` (or your preferred database name)

**Format:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kulfy?retryWrites=true&w=majority
```

**Example:**
```
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/kulfy?retryWrites=true&w=majority
```

### 2. PINATA_JWT

**What it is:** JSON Web Token for authenticating with Pinata IPFS service

**How to get it:**
1. Go to [Pinata API Keys](https://app.pinata.cloud/developers/api-keys)
2. Sign in or create an account
3. Click "New Key" or "Create API Key"
4. Give it a name (e.g., "Kulfy MCP Server")
5. Select permissions:
   - ✅ `pinFileToIPFS` (required)
   - ✅ `pinJSONToIPFS` (optional, for future use)
6. Click "Create"
7. **Copy the JWT token immediately** (you won't be able to see it again!)
8. Save it securely

**Format:**
```
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Security Note:** This token gives full access to your Pinata account. Keep it secret!

### 3. PINATA_GATEWAY

**What it is:** The gateway URL for accessing IPFS content

**Options:**
- **Public gateway (default):** `gateway.pinata.cloud`
- **Dedicated gateway (recommended for production):** Your custom gateway URL

**How to set up a dedicated gateway (optional):**
1. Go to [Pinata Gateway](https://app.pinata.cloud/gateway)
2. Click "Create Gateway"
3. Choose a subdomain (e.g., `kulfy.mypinata.cloud`)
4. Wait for DNS propagation (can take a few minutes)
5. Use your custom gateway URL

**Format:**
```
PINATA_GATEWAY=gateway.pinata.cloud
```

**Or with dedicated gateway:**
```
PINATA_GATEWAY=kulfy.mypinata.cloud
```

## Creating the .env File

1. **Copy the example file:**
   ```bash
   cd mcp-server
   cp env.example .env
   ```

2. **Edit the .env file** with your actual credentials:
   ```bash
   # Use your preferred text editor
   nano .env
   # or
   code .env
   # or
   vim .env
   ```

3. **Fill in your values:**
   - Replace `mongodb+srv://username:password@cluster.mongodb.net/kulfy...` with your actual MongoDB URI
   - Replace `your_pinata_jwt_token_here` with your actual Pinata JWT
   - Update `PINATA_GATEWAY` if you're using a custom gateway

4. **Save the file**

## Verification

After creating your `.env` file, verify it's set up correctly:

```bash
# Build the project
npm run build

# Test the server (it will fail if env vars are missing)
npm run dev
```

If you see connection errors, check:
- ✅ All 3 variables are set
- ✅ No extra spaces or quotes around values
- ✅ MongoDB URI is correctly formatted
- ✅ Pinata JWT is valid and not expired
- ✅ MongoDB Atlas allows connections from your IP address

## Security Best Practices

1. **Never commit `.env` to Git** - It's already in `.gitignore`
2. **Use different credentials for development and production**
3. **Rotate your Pinata JWT periodically**
4. **Restrict MongoDB Atlas IP whitelist in production**
5. **Use environment-specific `.env` files** (e.g., `.env.development`, `.env.production`)

## Troubleshooting

### "MONGODB_URI is not defined"
- Make sure your `.env` file is in the `mcp-server/` directory
- Check that the variable name is exactly `MONGODB_URI` (case-sensitive)
- Restart your terminal/process after creating the file

### "PINATA_JWT is not defined"
- Verify the variable name is `PINATA_JWT` (all caps)
- Make sure there are no spaces around the `=` sign
- Don't wrap the JWT token in quotes unless it contains special characters

### "MongoDB connection failed"
- Verify your connection string is correct
- Check MongoDB Atlas network access allows your IP
- Ensure your database user has read/write permissions
- Try connecting with MongoDB Compass to test the connection string

### "Pinata upload failed"
- Verify your JWT token is correct and not expired
- Check that your API key has `pinFileToIPFS` permission
- Ensure you haven't exceeded Pinata rate limits

## Example .env File

Here's what a complete `.env` file should look like:

```env
MONGODB_URI=mongodb+srv://myuser:SecurePassword123@cluster0.abc123.mongodb.net/kulfy?retryWrites=true&w=majority
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
PINATA_GATEWAY=gateway.pinata.cloud
```

**Remember:** Replace these with your actual credentials!

