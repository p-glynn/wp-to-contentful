import { writeFile } from 'fs';

/**
 * Write data to its own JSON file.
 * @param {Object} inputData - JSON data to write to file
 * @param {string} label - name of the file to write to
 */
export function writeDataToFile(inputData: object, label: string, { isError = false, isFull = false }) {
    console.log(`Writing ${label} data to file`);

    let outputDirectory = isFull ? 'full' : 'test';
    if (isError) {
        outputDirectory += '/errors';
    }

    const filePath = `./output/${outputDirectory}/${label}.json`;

    writeFile(filePath, JSON.stringify(inputData, null, 2), (err) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(`Finished writing ${label} data`);
    });
}
