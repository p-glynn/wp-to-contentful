import contentful, { Environment, Entry } from 'contentful-management';
import { readFileSync } from 'fs';

import { localeString, questionTypes, imageProperties, markedImageProperties, videoProperties } from './constants';

import { writeDataToFile, delay, getContentfulEnvironment } from './_utils';
import { ContentfulQuestion, Media, Question, AssetLink } from '../types/types';

/**
 * Fetch data from JSON file
 */
function loadQuestionsFromFile(questionType: string, fullUpload: boolean): Question[] {
    const pathHelper = fullUpload ? 'full' : 'test';
    const data = readFileSync(`data/${pathHelper}/${questionType}.json`, 'utf8');
    return JSON.parse(data);
}

async function formatQuestionForContentful(environment: Environment, question: Question): Promise<ContentfulQuestion> {
    let updatedQuestionType = question.question_type;
    switch (updatedQuestionType) {
        case 'ecg':
            updatedQuestionType = 'ECG';
            break;
        case 'echo':
            updatedQuestionType = 'ECHO';
            break;
        case 'angiogram':
            updatedQuestionType = 'Angiogram';
            break;
        case 'cv_image':
            updatedQuestionType = 'QBank';
            break;
        default:
            break;
    }
    const { images, videos, markedImages } = await prepareMedia(environment, question);

    return {
        fields: {
            questionTitle: {
                [localeString]: question.question_title,
            },
            questionType: {
                [localeString]: updatedQuestionType,
            },
            wordpressId: {
                [localeString]: question.id,
            },
            explanation: {
                [localeString]: question.explanation,
            },
            secondaryText: {
                [localeString]: question.secondary_text || '',
            },
            images: {
                [localeString]: images,
            },
            markedImages: {
                [localeString]: markedImages,
            },
            videos: {
                [localeString]: videos,
            },
        },
    };
}

async function prepareMedia(environment: Environment, question: Question) {
    const images: Media[] = [];
    const markedImages: Media[] = [];
    const videos: Media[] = [];

    [imageProperties, markedImageProperties, videoProperties].forEach((properties: string[]) => {
        properties.forEach((property: string) => {
            if (property in question && question[property]) {
                console.log(`Preparing media for ${property}, ${question[property]}`);
                const media = generateMediaBody(question[property] as string);
                if (media) {
                    if (properties === imageProperties) {
                        images.push(media);
                    } else if (properties === markedImageProperties) {
                        markedImages.push(media);
                    } else {
                        videos.push(media);
                    }
                }
            }
        });
    });

    const imageAssets = await uploadAllMedia(environment, images);
    const markedImageAssets = await uploadAllMedia(environment, markedImages);
    const videoAssets = await uploadAllMedia(environment, videos);

    const imageLinks = getAssetLinks(imageAssets);
    const markedImageLinks = getAssetLinks(markedImageAssets);
    const videoLinks = getAssetLinks(videoAssets);

    return {
        images: imageLinks,
        markedImages: markedImageLinks,
        videos: videoLinks,
    };
}

function getAssetLinks(assets: contentful.Asset[]): AssetLink[] {
    return assets.map((asset) => ({
        sys: {
            type: 'Link',
            linkType: 'Asset',
            id: asset.sys.id,
        },
    }));
}

function generateMediaBody(url: string) {
    if (!url) {
        return;
    }
    const regex = /\/uploads\/(.*?)\.([^.]+)$/;
    const match = url.match(regex);

    if (match) {
        const [, fileName, originalContentType] = match;
        const contentType = originalContentType === 'mp4' ? 'video/mp4' : `image/${originalContentType}`;
        return {
            contentType,
            fileName,
            url,
        };
    } else {
        writeDataToFile({ url }, 'media/errors', 'media', true);
    }
}

async function uploadAllMedia(environment: Environment, mediaArray: Media[]): Promise<contentful.Asset[]> {
    // const mediaQueue: (() => Promise<unknown>)[] = [];
    // mediaArray.forEach((media) => {
    //     mediaQueue.push(async () => {
    //         try {
    //             const asset = await uploadMedia(environment, media);
    //             return asset; // Return the asset directly
    //         } catch (error) {
    //             console.error(`Error uploading media: ${error}`);
    //             return error; // Rethrow the error to handle it in the queue processing
    //         }
    //     });
    // });
    const assets = (
        await Promise.all(
            mediaArray.map(async (mediaFile: Media) => {
                await delay(500);
                return uploadMedia(environment, mediaFile);
            })
        )
    ).filter((asset): asset is contentful.Asset => asset !== undefined);
    // const assets = await processMediaQueue(mediaQueue); // No need to flatten
    return assets;
}

async function uploadMedia(
    environment: Environment,
    { contentType, fileName, url }: Media
): Promise<contentful.Asset | undefined> {
    try {
        console.log(`Uploading media: ${{ fileName, contentType, url }}`);

        if (!contentType || !fileName || !url) {
            throw new Error('Missing required media properties');
        }

        let asset = await environment.createAsset({
            fields: {
                title: {
                    [localeString]: fileName,
                },
                file: {
                    [localeString]: {
                        contentType,
                        fileName,
                        upload: url,
                    },
                },
            },
        });

        asset = await asset.processForAllLocales();
        asset = await asset.publish();

        console.log(`uploaded media: ${asset.sys.id}`);

        return asset;
    } catch (error) {
        console.error(`Error uploading media: ${error}`);
    }
}

async function createQuestions(
    environment: Environment,
    questions: Question[],
    questionType: string,
    fullUpload: boolean
) {
    const failedUploadQuestionIds: number[] = [];
    const queue: (() => Promise<void>)[] = [];
    questions.forEach(async (question: Question, index: number) => {
        await queue.push(async (): Promise<Entry | undefined> => {
            console.log(`Creating question: ${question.id}`);
            try {
                if (!fullUpload && index >= 2) {
                    return;
                }

                const questionFields = await formatQuestionForContentful(environment, question);
                const questionUpload: Entry = await environment.createEntry('question', questionFields);

                const publishedQuestion = await questionUpload.publish();
                console.log(`${Date.now()} - Published question: ${publishedQuestion.sys.id}`);
                return publishedQuestion;
            } catch (error) {
                console.error(`Error creating post: ${error}`);
                failedUploadQuestionIds.push(question.id);
            }
        });
    });
    const subDir = fullUpload ? 'full' : 'test';
    if (failedUploadQuestionIds.length) {
        await writeDataToFile(failedUploadQuestionIds, `${subDir}/errors`, questionType);
    }
    return queue;
}

/**
 * Contentful API Call
 */
export async function createForContentful(fullUpload = false): Promise<void> {
    try {
        const environment: Environment = await getContentfulEnvironment();
        await Promise.all(
            questionTypes.map(async (questionType: string) => {
                const questions = loadQuestionsFromFile(questionType, fullUpload);
                const queue = await createQuestions(environment, questions, questionType, fullUpload);
                console.log(queue);
                await processQueue(queue);
            })
        );
    } catch (error) {
        console.error(`Error with data or environment setup: ${error}`);
    }
}

// createForContentful();

// const queue: (() => Promise<void>)[] = [];

// Use a queue to artificially add a delay / avoid rate limiting
// export async function processMediaQueue(queue: (() => Promise<contentful.Asset | undefined>)[]) {
//     const output = [];
//     while (queue.length > 0) {
//         const task = queue.shift();
//         if (task) {
//             const media = await task();
//             output.push(media);
//             await delay(500); // Adjust the delay as needed
//         }
//     }
//     return output;
// }

// Use a queue to artificially add a delay / avoid rate limiting
export async function processQueue(queue: (() => Promise<void>)[]) {
    while (queue.length > 0) {
        const task = queue.shift();
        if (task) {
            await task();
            await delay(500); // Adjust the delay as needed
        }
    }
}
