#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { approvePostTool, handleApprovePost } from './tools/approve-post.js';
import { rejectPostTool, handleRejectPost } from './tools/reject-post.js';
import { getPendingTool, handleGetPending } from './tools/get-pending.js';
import { uploadMemeTool, handleUploadMeme } from './tools/upload-meme.js';

const server = new Server(
  {
    name: 'kulfy-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      uploadMemeTool,
      getPendingTool,
      approvePostTool,
      rejectPostTool,
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request: { params: { name: string; arguments?: any } }) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'upload_meme': {
        const result = await handleUploadMeme(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_pending_posts': {
        const result = await handleGetPending(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'approve_post': {
        const result = await handleApprovePost(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'reject_post': {
        const result = await handleRejectPost(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Kulfy MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

