import { writeFile } from 'fs';
import { _delimiter } from './variables';

/**
 * Write all exported WP data to its own JSON file.
 * @param {Object} inputData - JSON data to write to file
 * @param {string} label - type of WordPress API endpoint.
 */
export function writeDataToFile(inputData: object, label: string, isError = false) {
    console.log(`Writing ${label} data to file`);

    const filePath = isError ? `./output/errors/${label}.json` : `./output/${label}.json`;

    writeFile(filePath, JSON.stringify(inputData, null, 2), (err) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(`...Done!`);
        console.log(_delimiter);
    });
}
