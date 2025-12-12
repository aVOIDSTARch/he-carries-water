import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export enum ProcessSource {
    AUTH_SERVER = 'AUTH_SERVER',
    API_ROUTER = 'API_ROUTER',
    DATABASE_CONNECTOR = 'DATABASE_CONNECTOR',
    SYSTEM_MONITOR = 'SYSTEM_MONITOR',
    IMAGE_PROCESSOR = 'IMAGE_PROCESSOR'
}

export interface ServerEvent {
    id?: string;
    timestamp: string;
    source: ProcessSource;
    level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
    message: string;
    context?: Record<string, any>;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
}

class LogQueue {
    private queue: ServerEvent[] = [];
    private isProcessing = false;
    private logDir: string;

    constructor() {
        this.logDir = path.resolve(process.cwd(), 'logs/server');
    }

    public push(event: ServerEvent): void {
        // Ensure ID and timestamp exist
        if (!event.id) {
            event.id = crypto.randomUUID();
        }

        this.queue.push(event);

        // Trigger processing if not already running
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;

        try {
            // Ensure log directory exists
            await fs.mkdir(this.logDir, { recursive: true });

            while (this.queue.length > 0) {
                // Take a batch of events (to minimize file IO)
                const batch = this.queue.splice(0, this.queue.length);

                // Group by date to handle date rollover
                const eventsByDate = new Map<string, ServerEvent[]>();

                for (const event of batch) {
                    const date = new Date(event.timestamp);
                    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

                    if (!eventsByDate.has(dateKey)) {
                        eventsByDate.set(dateKey, []);
                    }
                    eventsByDate.get(dateKey)!.push(event);
                }

                // Write batches to files
                for (const [dateKey, events] of eventsByDate) {
                    const filepath = path.join(this.logDir, `${dateKey}.json`);
                    let fileEvents: ServerEvent[] = [];

                    try {
                        // Read existing file
                        try {
                            const content = await fs.readFile(filepath, 'utf-8');
                            fileEvents = JSON.parse(content);
                        } catch (e) {
                            // File doesn't exist or is empty/invalid
                            fileEvents = [];
                        }

                        // Append new events
                        fileEvents.push(...events);

                        // Write back
                        await fs.writeFile(filepath, JSON.stringify(fileEvents, null, 2), 'utf-8');
                    } catch (err) {
                        console.error(`[ServerLogger] Failed to write logs for ${dateKey}:`, err);
                        // In a real production system, we might want to retry or fallback
                        // For now, we'll just log to console
                    }
                }
            }
        } catch (error) {
            console.error('[ServerLogger] Fatal error in log processor:', error);
        } finally {
            this.isProcessing = false;

            // Check if more events arrived while processing
            if (this.queue.length > 0) {
                // Schedule next tick
                setTimeout(() => this.processQueue(), 0);
            }
        }
    }
}

// Singleton instance
const loggerQueue = new LogQueue();

/**
 * Logs a server event to the central system log
 */
export function logServerEvent(event: Omit<ServerEvent, 'timestamp'> & { timestamp?: string }): void {
    const fullEvent: ServerEvent = {
        ...event,
        timestamp: event.timestamp || new Date().toISOString()
    };

    loggerQueue.push(fullEvent);

    // Also log to console in dev mode
    const isDev = (typeof import.meta !== 'undefined' && import.meta.env?.DEV) || process.env.NODE_ENV === 'development';

    if (isDev) {
        const color = event.level === 'ERROR' || event.level === 'FATAL' ? '\x1b[31m' :
            event.level === 'WARN' ? '\x1b[33m' : '\x1b[36m';
        const reset = '\x1b[0m';
        console.log(`${color}[${event.source}] ${event.level}: ${event.message}${reset}`);
    }
}
