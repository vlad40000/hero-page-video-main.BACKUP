const { startApplianceSearchSession } = require('../lib/tools/parts/parts-service');
const { db } = require('../lib/db');
require('dotenv').config({ path: '.env.local' });

async function testSearch() {
  console.log('Testing Part Finder engine with live DB...');
  
  const testInput = {
    modelNumber: 'WDT730PAHZ0',
    sessionId: `test-${Date.now()}`
  };

  try {
    const result = await startApplianceSearchSession(testInput);
    console.log('Search successful!');
    console.log('Status:', result.status);
    console.log('Parts found:', result.parts?.length || 0);
    console.log('Sources:', result.sources?.length || 0);
    
    if (result.parts?.length > 0) {
      console.log('Sample part:', result.parts[0].partNumber, '-', result.parts[0].name);
    }
  } catch (err) {
    console.error('Search failed:', err);
  }
}

testSearch().then(() => process.exit());
