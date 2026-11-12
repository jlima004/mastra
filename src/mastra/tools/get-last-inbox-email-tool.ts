import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { findGmailEmails, getGmailConnectionId } from '../mcp/zapier';

function summarizeFindEmailResult(result: unknown) {
  const text = (result as { content?: Array<{ text?: string }> })?.content?.[0]?.text;
  if (!text) {
    return { summary: 'No email data returned from Zapier.', raw: result };
  }

  let parsed: { results?: Array<{ id?: string; raw?: Record<string, unknown> }> };
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    return { summary: text.slice(0, 500), raw: result };
  }

  const first = parsed.results?.[0]?.raw;
  if (!first || typeof first !== 'object') {
    return { summary: 'No matching emails found.', queryUsed: true, raw: parsed };
  }

  const snippet = typeof first.snippet === 'string' ? first.snippet : undefined;
  const payload = first.payload as { headers?: Record<string, string> } | undefined;
  const headers = payload?.headers;

  return {
    messageId: first.id,
    subject: headers?.Subject,
    from: headers?.From,
    to: headers?.To,
    date: headers?.Date,
    snippet,
  };
}

export const getLastInboxEmailTool = createTool({
  id: 'get-last-inbox-email',
  description:
    'Get the most recent Gmail inbox message via Zapier. Use this instead of raw Zapier execute tools when the user asks for their last/latest email.',
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe('Gmail search query. Defaults to in:inbox for the latest inbox message.'),
  }),
  execute: async ({ query = 'in:inbox' }) => {
    const connection_id = await getGmailConnectionId();
    const result = await findGmailEmails(query, connection_id);
    const summary = summarizeFindEmailResult(result);
    return { ...summary, accountConnectionId: connection_id, query };
  },
});
