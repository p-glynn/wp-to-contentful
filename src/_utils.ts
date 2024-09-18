import { appendFile, writeFile, access, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Write data to its own JSON file.
 * @param {Object} inputData - JSON data to write to file
 * @param {string} subdirectory - location directory to write to
 * @param {string} fileName - name of the file
 * @param {boolean} append - whether to append to the file or overwrite it
 */
export async function writeDataToFile(inputData: object, subdirectory: string, fileName: string, append = false) {
    console.log(`Writing ${fileName}.json to output/${subdirectory}`);

    const filePath = join('output', subdirectory, `${fileName}.json`);

    try {
        try {
            await access(filePath);
        } catch {
            await mkdir(filePath, { recursive: true });
        }

        const dataToWrite = JSON.stringify(inputData, null, 2);
        if (append) {
            await appendFile(filePath, dataToWrite);
        } else {
            await writeFile(filePath, dataToWrite);
        }

        console.log(`Finished writing output/${subdirectory}/${fileName}.json`);
    } catch (error) {
        console.error(`Error writing file: ${error}`);
    }
}

/**
 * Delays the execution for a specified number of milliseconds (to prevent rate limiting).
 *
 * @param ms - The number of milliseconds to delay.
 * @returns A promise that resolves after the specified delay.
 */
export function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
