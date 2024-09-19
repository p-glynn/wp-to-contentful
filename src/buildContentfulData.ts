import contentful, { Environment, Space, Entry } from 'contentful-management';
import { readFileSync } from 'fs';

import {
    CTF_TOKEN,
    CTF_ENV,
    CTF_SPACE_ID,
    localeString,
    questionTypes,
    imageProperties,
    markedImageProperties,
    videoProperties,
} from './constants';
import { writeDataToFile, delay } from './_utils';
import { ContentfulQuestion, Media, Question, AssetLink } from '../types/types';

const queue: (() => Promise<void>)[] = [];

export async function processQueue(fullUpload = false) {
    await createForContentful(fullUpload);
    while (queue.length > 0) {
        const task = queue.shift();
        if (task) {
            await task();
            await delay(500); // Adjust the delay as needed
        }
    }
}

/**
 * Instantiate Contentful Client
 */
const contentfulClient = contentful.createClient({
    accessToken: CTF_TOKEN || '',
});

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
    const assets = (
        await Promise.all(
            mediaArray.map(async (mediaFile: Media) => {
                await delay(500);
                return uploadMedia(environment, mediaFile);
            })
        )
    ).filter((asset): asset is contentful.Asset => asset !== undefined);
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
    questions.forEach((question: Question, index: number) => {
        queue.push(async () => {
            try {
                if (!fullUpload && index >= 2) {
                    return;
                }

                const questionFields = await formatQuestionForContentful(environment, question);
                const questionUpload: Entry = await environment.createEntry('question', questionFields);

                const publishedQuestion = await questionUpload.publish();
                console.log(`${Date.now()} - Published question: ${publishedQuestion.sys.id}`);
            } catch (error) {
                console.error(`Error creating post: ${error}`);
                failedUploadQuestionIds.push(question.id);
            }
        });
    });
    const subDir = fullUpload ? 'full' : 'test';
    if (failedUploadQuestionIds.length) {
        writeDataToFile(failedUploadQuestionIds, `${subDir}/errors`, questionType);
    }
}

/**
 * Contentful API Call
 */
async function createForContentful(fullUpload = false) {
    try {
        const space: Space = await contentfulClient.getSpace(CTF_SPACE_ID || '');
        await delay(500);
        const environment: Environment = await space.getEnvironment(CTF_ENV || 'master');
        await delay(500);

        questionTypes.forEach(async (questionType: string) => {
            const questions = loadQuestionsFromFile(questionType, fullUpload);
            await createQuestions(environment, questions, questionType, fullUpload);
        });
    } catch (error) {
        console.error(`Error with data or environment setup: ${error}`);
    }
}

// createForContentful();
