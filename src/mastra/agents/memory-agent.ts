import { Agent } from '@mastra/core/agent';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import { Memory } from '@mastra/memory';

const memory = new Memory({
  storage: new LibSQLStore({
    id: 'learning-memory-storage',
    url: process.env.MASTRA_DB_URL!,
  }),
  vector: new LibSQLVector({
    id: 'learning-memory-vector',
    url: process.env.MASTRA_VECTOR_DB_URL!,
  }),
  embedder: 'openai/text-embedding-3-small',
  options: {
    // Conversation history
    lastMessages: 20,
    // Semantic recall
    semanticRecall: {
      topK: 3,
      messageRange: {
        before: 2,
        after: 1,
      },
    },
    // Working memory
    workingMemory: {
      enabled: true,
      template: `
# User Profile

## Personal Info
- Name:
- Location:
- Timezone:
- Occupation:

## Preferences
- Communication Style:
- Topics of Interest:
- Learning Goals:

## Project Information
- Current Projects:
  - [Project 1]:
    - Deadline:
    - Status:
  - [Project 2]:
    - Deadline:
    - Status:

## Session State
- Current Topic:
- Open Questions:
- Action Items:
`,
    },
  },
});

export const memoryAgent = new Agent({
  id: 'memory-agent',
  name: 'MemoryAgent',
  instructions: `
    You are a helpful assistant with advanced memory capabilities.
    You use conversation history, semantic recall, and working memory together.

    IMPORTANT: You have access to working memory to store persistent information about the user.
    When you learn something important about the user, update your working memory according to the template.

    Always refer to your working memory before asking for information the user has already provided.
    Use the information in your working memory to provide personalized responses.

    When the user shares personal information such as their name, location, or preferences,
    acknowledge it and update your working memory accordingly.

    If asked about something mentioned earlier in the conversation, recall it accurately.
    You can also recall relevant information from older conversations when appropriate.
  `,
  model: 'openai/gpt-5.4',
  memory,
});
