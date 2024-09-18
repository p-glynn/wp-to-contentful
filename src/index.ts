import { fetchWordpressData } from './fetchWordPressData';
import { processQueue } from './buildContentfulData';

// script.ts
const args = process.argv.slice(2); // Ignore the first two arguments (node and script path)

async function runMigration() {
    const full = args[1] === 'full';
    if (!args[0] || args[0] === 'wordpress') {
        fetchWordpressData(full);
    } else if (args[0] === 'contentful') {
        processQueue(full);
    } else if (args[0] === 'both') {
        await fetchWordpressData(full);
        processQueue(full);
    }
}

runMigration();
