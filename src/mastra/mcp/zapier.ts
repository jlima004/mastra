import { isAbsolute } from 'node:path';
import { MCPClient } from '@mastra/mcp';

export const notesDir = process.env.NOTES_DIR;

if (!notesDir || !isAbsolute(notesDir)) {
  throw new Error('Set NOTES_DIR to the absolute path of your notes directory');
}

export const mcpClient = new MCPClient({
  servers: {
    zapier: {
      url: new URL(process.env.ZAPIER_MCP_URL || ''),
      requestInit: {
        headers: {
          Authorization: `Bearer ${process.env.ZAPIER_MCP_API_KEY}`,
        },
      },
    },
    github: {
      url: new URL('https://api.githubcopilot.com/mcp/'),
      requestInit: {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
        },
      },
    },
    hackernews: {
      command: 'npx',
      args: ['-y', '@devabdultech/hn-mcp-server'],
    },
    textEditor: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', notesDir],
    },
  },
});

export const mcpTools = await mcpClient.listTools();

function parseZapierTextPayload(result: unknown): unknown {
  if (!result || typeof result !== 'object') return result;
  const content = (result as { content?: Array<{ text?: string }> }).content;
  const text = content?.[0]?.text;
  if (!text) return result;
  try {
    return JSON.parse(text);
  } catch {
    return { rawText: text };
  }
}

export async function getGmailConnectionId(): Promise<string> {
  const listTool = mcpTools['zapier_list_zapier_connections'];
  if (!listTool?.execute) {
    throw new Error('Zapier connection tool is not available.');
  }

  const listed = await listTool.execute({ selected_api: 'GoogleMailV2CLIAPI' });
  const parsed = parseZapierTextPayload(listed) as {
    connections?: Array<{ id: string; title?: string }>;
  };

  const connectionId = parsed.connections?.[0]?.id;
  if (!connectionId) {
    throw new Error('No Gmail connection found in Zapier. Connect Gmail at mcp.zapier.com.');
  }

  return connectionId;
}

export async function findGmailEmails(query: string, connectionId?: string) {
  const execTool = mcpTools['zapier_execute_zapier_read_action'];
  if (!execTool?.execute) {
    throw new Error('Zapier execute tool is not available.');
  }

  const connection_id = connectionId ?? (await getGmailConnectionId());

  return execTool.execute({
    selected_api: 'GoogleMailV2CLIAPI',
    action: 'message',
    tool_name: 'gmail_find_email',
    connection_id,
    params: { query },
  });
}
