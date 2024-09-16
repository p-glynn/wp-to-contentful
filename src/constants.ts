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

// can re-label to "customPostTypes" before finalizing?
export const questionTypes = ['angiogram', 'ecg', 'echo', 'cv_image'];

// Contentful
export const localeString = 'en-US';
