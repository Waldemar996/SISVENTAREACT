// Configuration
const BASE_URL = 'http://127.0.0.1:8000';
const TOTAL_REQUESTS = 10000; // User asked for 10k-50k. Let's start with 10k to be safe on local OS ports.
const CONCURRENCY = 200; // 200 requests at a time (PHP serve limit is usually 1, but this queues them)

async function runStressTest() {
    console.log(`🚀 Starting High Volume Stress Test`);
    console.log(`- Total Requests: ${TOTAL_REQUESTS}`);
    console.log(`- Concurrency (Batch Size): ${CONCURRENCY}`);
    console.log(`- Target: ${BASE_URL}/api/operaciones/ventas/calcular-totales`);

    const start = Date.now();
    let completed = 0;
    let success = 0;
    let failed = 0;

    // Helper to calculate totals
    const makeRequest = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/operaciones/ventas/calcular-totales`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ items: [{ producto_id: 1, cantidad: 1 }] })
            });
            if (res.status === 200) success++;
            else failed++;
        } catch (e) {
            failed++;
        }
    };

    // Queue system
    for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENCY) {
        const batchSize = Math.min(CONCURRENCY, TOTAL_REQUESTS - i);
        const batchPromises = Array.from({ length: batchSize }, makeRequest);

        await Promise.all(batchPromises);

        completed += batchSize;
        process.stdout.write(`\rProgress: ${completed}/${TOTAL_REQUESTS} (${Math.round(completed / TOTAL_REQUESTS * 100)}%)`);
    }

    const duration = (Date.now() - start) / 1000;

    console.log(`\n\n📊 High Volume Results:`);
    console.log(`- Time: ${duration.toFixed(2)} seconds`);
    console.log(`- Success (200 OK): ${success}`);
    console.log(`- Failed (Errors/5xx): ${failed}`);
    console.log(`- Throughput (RPS): ${(success / duration).toFixed(2)} req/sec`);

    if (failed / TOTAL_REQUESTS > 0.05) {
        console.log(`⚠️ High Failure Rate. The server likely choked or ran out of connections.`);
    } else {
        console.log(`✅ Server handled the load gracefully.`);
    }
}

runStressTest();
