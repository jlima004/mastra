import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { DuckDBStore } from '@mastra/duckdb';
import { MastraCompositeStore } from '@mastra/core/storage';
import {
  MastraStorageExporter,
  MastraPlatformExporter,
  Observability,
  SensitiveDataFilter,
} from '@mastra/observability';
import { agent } from './agents/agent';
import { contentAgent } from './agents/content-agent';
import { financialAgent } from './agents/financial-agent';
import { learningAssistantAgent } from './agents/learning-assistant';
import { memoryAgent } from './agents/memory-agent';
import { startScheduleTool, stopScheduleTool } from './tools/schedule-tools';
import {
  aiContentWorkflow,
  conditionalWorkflow,
  contentWorkflow,
  parallelAnalysisWorkflow,
} from './workflows/content-workflow';

export const mastra = new Mastra({
  bundler: {
    externals: ['@duckdb/node-bindings'],
  },
  agents: {
    agent,
    contentAgent,
    financialAgent,
    memoryAgent,
    learningAssistantAgent,
  },
  workflows: {
    contentWorkflow,
    aiContentWorkflow,
    parallelAnalysisWorkflow,
    conditionalWorkflow,
  },
  tools: { startScheduleTool, stopScheduleTool },
  storage: new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({
      id: 'mastra-storage',
      url: process.env.TURSO_DATABASE_URL || 'file:./mastra.db',
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    }),
    domains: {
      observability: await new DuckDBStore().getStore('observability'),
    },
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [new MastraStorageExporter(), new MastraPlatformExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  }),
});
