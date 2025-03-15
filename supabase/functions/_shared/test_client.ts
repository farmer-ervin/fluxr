// Test client for local development
// Run with: deno run --allow-net test_client.ts

const FUNCTION_URL = 'http://localhost:54321/functions/v1/beta_openAI';

async function testFunction() {
  const testData = {
    text: 'This is a test PRD section.',
    action: 'improve',
    context: {
      section: 'overview',
      projectName: 'Test Project'
    }
  };

  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header when testing with auth
        // 'Authorization': 'Bearer your-test-token'
      },
      body: JSON.stringify(testData)
    });

    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testFunction(); 