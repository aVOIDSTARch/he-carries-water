
import { logServerEvent, ProcessSource } from '../src/lib/server-logger';
import type { ServerEvent } from '../src/lib/server-logger';
import fs from 'fs/promises';
import path from 'path';

async function runTest() {
    console.log('Starting server logger test...');

    // Clean up previous logs for today if any (optional, be careful)
    // For safety, we won't delete, just append and check count

    const iterations = 50;
    const sources = [
        ProcessSource.AUTH_SERVER,
        ProcessSource.API_ROUTER,
        ProcessSource.DATABASE_CONNECTOR,
        ProcessSource.SYSTEM_MONITOR
    ];

    const promises: Promise<void>[] = [];

    console.log(`Generating ${iterations * sources.length} events...`);

    for (let i = 0; i < iterations; i++) {
        for (const source of sources) {
            logServerEvent({
                source: source,
                level: 'INFO',
                message: `Test event ${i} from ${source}`,
                context: { iteration: i }
            });
        }
        // minimal delay to simulate async arrival
        await new Promise(r => setTimeout(r, 10));
    }

    console.log('All events pushed to queue. Waiting for processing...');

    // Give the queue some time to drain (since it's fire-and-forget)
    await new Promise(r => setTimeout(r, 2000));

    // Verify file content
    const date = new Date();
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const logPath = path.join(process.cwd(), 'logs/server', `${dateKey}.json`);

    try {
        const content = await fs.readFile(logPath, 'utf-8');
        const events: ServerEvent[] = JSON.parse(content);

        console.log(`Log file found at ${logPath}`);
        console.log(`Total events in file: ${events.length}`);

        // Check for our test events
        const testEvents = events.filter(e => e.message.startsWith('Test event'));
        console.log(`Test events found: ${testEvents.length}`);

        if (testEvents.length >= iterations * sources.length) {
            console.log('✅ SUCCESS: All test events appear to be recorded.');
        } else {
            console.error('❌ FAILURE: Missing events.');
        }

    } catch (e) {
        console.error('❌ FAILURE: Could not read log file', e);
    }
}

runTest();
