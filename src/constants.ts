import { configDotenv } from 'dotenv';
configDotenv();

export const { WP_HOST, CTF_TOKEN, CTF_ENV, CTF_SPACE_ID, WP_REST_API_USER, WP_REST_API_PW, WP_MIGRATION_ENDPOINT } =
    process.env;

export const _delimiter = `-------`;

/**
 * ----------------------------------------------
 * Project specific configuration
 */

// WordPress

export const pageSize = 25;
export const wpRestApiRequireAuth = false;

/**
 * API Endpoints that we'd like to receive data from
 * (e.g. /wp-json/wp/v2/${key})
 */
export const wpEndpoints = {
    // posts: [],
    // tags: [],
    // categories: [],
    // media: [],
    questions: [],
};

export const questionTypes = ['angiogram', 'ecg', 'echo', 'cv_image'];
export const questionTypesMap = {
    angiogram: 'Angiogram',
    ecg: 'ecg',
    echo: 'ECHO',
    cv_image: 'QBank',
};

export const imageProperties = [
    'question_ecg_image',
    'question_ecg_image_2',
    'question_ecg_image_3',
    'question_ecg_image_4',
    'question_ecg_image_5',
];

export const markedImageProperties = [
    'question_ecg_image_marked',
    'question_ecg_image_marked_2',
    'question_ecg_image_marked_3',
    'question_ecg_image_marked_4',
    'question_ecg_image_marked_5',
];

export const videoProperties = [
    'question_ecg_video',
    'question_ecg_video_2',
    'question_ecg_video_3',
    'question_ecg_video_4',
    'question_ecg_video_5',
    'question_ecg_video_6',
];

export const optionalProperties = [...imageProperties, ...markedImageProperties, ...videoProperties];

// Contentful
export const localeString = 'en-US';
