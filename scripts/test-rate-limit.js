const testRateLimiter = async () => {
  console.log('🚀 Starting Rate Limit Test (Sending 110 requests)...');
  
  let successCount = 0;
  let rateLimitedCount = 0;
  let errorCount = 0;

  // We'll send 110 requests simultaneously. 
  // Since the limit is 100, we expect exactly 10 requests to be blocked with 429.
  const promises = [];
  
  for (let i = 1; i <= 110; i++) {
    // Calling an open endpoint like health check on the gateway
    const reqPromise = fetch('http://localhost:3000/health')
      .then(res => {
        if (res.status === 200) {
          successCount++;
        } else if (res.status === 429) {
          rateLimitedCount++;
          if (rateLimitedCount === 1) {
            console.log(`⚠️  Request #${i} hit the Rate Limit (429 Too Many Requests)!`);
          }
        } else {
          errorCount++;
        }
      })
      .catch(() => {
        errorCount++;
      });
      
    promises.push(reqPromise);
  }

  // Wait for all 110 requests to finish
  await Promise.all(promises);

  console.log('\n📊 Test Results:');
  console.log(`✅ Successful Requests (200 OK): ${successCount}`);
  console.log(`🛑 Rate Limited Requests (429): ${rateLimitedCount}`);
  if (errorCount > 0) {
    console.log(`❌ Network Errors: ${errorCount}`);
  }
};

testRateLimiter();
