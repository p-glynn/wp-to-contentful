import fs from 'fs/promises';
import path from 'path';

/**
 * Write data to its own JSON file.
 * @param {Object} inputData - JSON data to write to file
 * @param {string} subdirectory - name of the file to write to
 */
export async function writeDataToFile(inputData: object, subdirectory: string, fileName: string, append = false) {
    console.log(`Writing ${fileName} data to file`);

    const filePath = path.join('output', subdirectory, `${fileName}.json`);

    try {
        let exists = false;
        try {
            await fs.access(filePath);
            exists = true;
        } catch {
            exists = false;
        }

        if (!exists) {
            await fs.mkdir(filePath, { recursive: true });
        }
        if (append) {
            await fs.appendFile(filePath, JSON.stringify(inputData, null, 2));
        } else {
            await fs.writeFile(filePath, JSON.stringify(inputData, null, 2));
        }
        console.log(`Finished writing ${subdirectory}/${fileName} data`);
    } catch (error) {
        console.error(`Error writing file: ${error}`);
    }
}

export function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
