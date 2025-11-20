# Kulfy MCP Server

Model Context Protocol (MCP) server for Kulfy - exposes meme management functions to AI assistants.

## Overview

This MCP server provides tools for AI assistants to interact with the Kulfy meme platform, including:
- Uploading memes to IPFS
- Viewing pending posts awaiting moderation
- Approving posts
- Rejecting posts

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the `mcp-server` directory with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kulfy?retryWrites=true&w=majority

# Pinata IPFS Configuration
PINATA_JWT=your_pinata_jwt_token_here

# Pinata Gateway (optional, defaults to public gateway)
PINATA_GATEWAY=gateway.pinata.cloud
```

### Getting Credentials

1. **MongoDB URI**: Get your connection string from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Pinata JWT**: Generate a JWT token from [Pinata API Keys](https://app.pinata.cloud/developers/api-keys)

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Available Tools

### 1. `upload_meme`

Upload a meme image to Kulfy. Accepts base64-encoded image data.

**Parameters:**
- `imageData` (required): Base64-encoded image data with data URI prefix (e.g., `data:image/png;base64,...`)
- `title` (optional): Title for the meme (max 140 characters)
- `sourceUrl` (optional): Source URL where this meme was created from

**Returns:**
- `postId`: The created post ID
- `cid`: IPFS CID of the uploaded image
- `message`: Success message

### 2. `get_pending_posts`

Get all pending posts awaiting moderation.

**Parameters:**
- `limit` (optional): Maximum number of posts to return (default: 50)

**Returns:**
- `count`: Number of posts returned
- `posts`: Array of post objects with `id`, `title`, `cid`, `createdAt`, and `userId`

### 3. `approve_post`

Approve a pending post. Automatically adds auto-generated tags.

**Parameters:**
- `postId` (required): The ID of the post to approve

**Returns:**
- `success`: Boolean indicating success
- `postId`: The post ID
- `status`: Updated post status
- `tags`: Array of tag names added to the post

### 4. `reject_post`

Reject a pending post. Optionally provide rejection notes.

**Parameters:**
- `postId` (required): The ID of the post to reject
- `notes` (optional): Rejection notes (max 500 characters)

**Returns:**
- `success`: Boolean indicating success
- `postId`: The post ID
- `status`: Updated post status
- `notes`: Rejection notes

## Testing the MCP Server

### Web UI Test Interface

A test interface is available in the Next.js app at `/mcp-test` to test the MCP server tools via the underlying API routes. This is useful for:
- Testing tool functionality before using with MCP clients
- Debugging tool responses
- Understanding tool behavior

Visit: `http://localhost:3000/mcp-test`

### Direct Testing

You can also test the MCP server directly by running it and sending MCP protocol messages via stdio, but the web UI is easier for quick testing.

## Usage with MCP Clients

This server uses stdio transport and can be configured in MCP client applications (e.g., Claude Desktop, Cursor).

Example configuration for Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "kulfy": {
      "command": "node",
      "args": ["/path/to/kulfy-ai/mcp-server/dist/index.js"],
      "env": {
        "MONGODB_URI": "mongodb+srv://...",
        "PINATA_JWT": "your_jwt_token",
        "PINATA_GATEWAY": "gateway.pinata.cloud"
      }
    }
  }
}
```

## Project Structure

```
mcp-server/
├── src/
│   ├── index.ts           # Main server entry point
│   ├── models/            # Mongoose models
│   │   ├── Post.ts
│   │   ├── Tag.ts
│   │   └── User.ts
│   ├── tools/             # MCP tool definitions and handlers
│   │   ├── approve-post.ts
│   │   ├── reject-post.ts
│   │   ├── get-pending.ts
│   │   └── upload-meme.ts
│   └── utils/             # Utility functions
│       ├── db.ts          # Database connection
│       └── pinata.ts      # Pinata IPFS upload
├── package.json
├── tsconfig.json
└── README.md
```

## Building

The project uses TypeScript and compiles to the `dist/` directory:

```bash
npm run build
```

## Dependencies

- `@modelcontextprotocol/sdk`: MCP SDK for building the server
- `mongoose`: MongoDB ODM
- `form-data`: For handling multipart/form-data uploads to Pinata
- `zod`: Schema validation (for future use)

## License

See the main project LICENSE file.

