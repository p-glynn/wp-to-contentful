import contentful, { Environment, Space, Entry } from 'contentful-management';
import { readFileSync } from 'fs';

import { writeDataToFile } from './_utils';
import { CTF_TOKEN, CTF_ENV, CTF_SPACE_ID, localeString, questionTypes } from './variables';
import { Question } from '../types/types';

/**
 * Instantiate Contentful Client
 */
const ctfClient = contentful.createClient({
    accessToken: CTF_TOKEN || '',
});

/**
 * Fetch data from JSON file
 */
function loadQuestionsFromFile(questionType: string): Question[] {
    const data = readFileSync(`output/${questionType}.json`, 'utf8');
    return JSON.parse(data);
}

function formatQuestionForContentful(question: Question) {
    let updatedQuestionType = question.question_type;
    switch (question.question_type) {
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
    return {
        fields: {
            questionTitle: {
                [localeString]: question.question_title,
            },
            questionType: {
                [localeString]: updatedQuestionType,
            },
        },
    };
}

function createQuestions(questions: Question[], questionType: string, environment: Environment, full: boolean) {
    const failedUploadQuestionIds: number[] = [];
    questions.forEach((question: Question, index: number) => {
        try {
            if (!full && index >= 5) {
                return;
            }
            const questionFields = formatQuestionForContentful(question);
            // Add a delay to avoid rate limiting
            setTimeout(async () => {
                const questionUpload: Entry = await environment.createEntry('question', questionFields);

                const publishedQuestion = await questionUpload.publish();
                console.log(`Published question: ${publishedQuestion.sys.id}`);
            }, 500);
        } catch (error) {
            console.error(`Error creating post: ${error}`);
            failedUploadQuestionIds.push(question.id);
        }
    });
    writeDataToFile(failedUploadQuestionIds, questionType, { isError: true, fetchAll: full });
}

/**
 * Contentful API Call
 */
export async function createForContentful(full = false) {
    try {
        const space: Space = await ctfClient.getSpace(CTF_SPACE_ID || '');
        const environment: Environment = await space.getEnvironment(CTF_ENV || 'master');

        questionTypes.forEach(async (questionType: string) => {
            const questions = loadQuestionsFromFile(questionType);
            createQuestions(questions, questionType, environment, full);
        });
    } catch (error) {
        console.error(`Error with data or environment setup: ${error}`);
    }
}

// createForContentful();
