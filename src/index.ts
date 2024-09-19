import { fetchWordpressData } from './fetchWordPressData';
import { createForContentful } from './buildContentfulData';

const args = process.argv.slice(2); // Ignore the first two arguments (node and script path)

async function runMigration() {
    const full = args[1] === 'full';
    if (!args[0] || args[0] === 'wordpress') {
        fetchWordpressData(full);
    } else if (args[0] === 'contentful') {
        createForContentful(full);
    } else if (args[0] === 'both') {
        await fetchWordpressData(full);
        createForContentful(full);
    }
}

runMigration();
