import 'dotenv/config';

import { mastra } from './mastra';

async function runContentWorkflow() {
  console.log('🚀 Running workflow programmatically...\n');

  try {
    const workflow = mastra.getWorkflow('contentWorkflow');

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const run = await workflow.createRun();

    const result = await run.start({
      inputData: {
        content:
          'Climate change is one of the most pressing challenges of our time, requiring immediate action from governments, businesses, and individuals worldwide.',
        type: 'blog',
      },
    });

    if (result.status === 'success') {
      console.log('✅ Success!');
      console.log('📊 Reading time:', result.result.metadata.readingTime, 'minutes');
      console.log('🎯 Difficulty:', result.result.metadata.difficulty);
      console.log('📅 Processed at:', result.result.metadata.processedAt);
      console.log('📝 Summary:', result.result.summary);
    }
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  }
}

runContentWorkflow();
