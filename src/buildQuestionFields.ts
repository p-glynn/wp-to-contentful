import { ContentType, Environment } from 'contentful-management';

import { getContentfulEnvironment, delay } from './_utils';
import { InputField, FieldGroup } from '../types/types';
import { readFileSync } from 'fs';
import { env } from 'process';

// import { questionTypesMap } from './constants';

const args = process.argv.slice(2); // Ignore the first two arguments (node and script path)
const inputType = args[0];

const queue: (() => Promise<void>)[] = [];

async function processQueue() {
    while (queue.length > 0) {
        const task = queue.shift();
        if (task) {
            await task();
            await delay(500); // Adjust the delay as needed
        }
    }
}

async function writeQuestionFields(inputType: string) {
    if (!inputType) {
        throw new Error('Please provide a question type');
    }
    try {
        // const outputType: string = questionTypesMap[inputType];
        const environment: Environment = await getContentfulEnvironment();

        const file = readFileSync(`data/fields/${inputType}_formatted.json`, 'utf8');
        const { groups } = JSON.parse(file);
        groups.forEach(({ id, label, data }: FieldGroup) => {
            const fields = data.map((field: InputField) => buildFieldObject(field));

            const uploadData = {
                name: label,
                fields,
            };

            // first delete the content type if it exists
            queue.push(async () => {
                try {
                    const contentType = await environment.getContentType(id);
                    if (contentType) {
                        if (contentType.sys.publishedCounter && contentType.sys.publishedCounter > 0) {
                            try {
                                await contentType.unpublish();
                            } catch {
                                console.error(`Error unpublishing content type: ${id}`);
                            }
                        }
                        try {
                            await contentType.delete();
                        } catch {
                            console.error(`Error deleting content type: ${id}`);
                        }
                    }
                } catch {
                    console.error(`Error updating content type: ${id}`);
                }
            });

            // then create the content type
            queue.push(async () => {
                try {
                    const contentType: ContentType = await environment.createContentTypeWithId(id, uploadData);
                    await contentType.publish();
                    console.log(`Created content type: ${contentType.sys.id}`);
                } catch (error) {
                    console.error(`Error creating content type: ${error}`);
                }
            });
        });

        processQueue();
    } catch (error) {
        console.error(`Error updating content type: ${error}`);
    }
}

function buildFieldObject({ id, label }: InputField) {
    if (id.length > 50) {
        throw new Error(`ID too long: ${id} - length: ${id.length}`);
    }
    if (label.length > 50) {
        throw new Error(`Label too long: ${label} - length: ${label.length}`);
    }

    return {
        id: id,
        name: label,
        type: 'Integer',
        localized: true,
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
    };
}

writeQuestionFields(inputType);
