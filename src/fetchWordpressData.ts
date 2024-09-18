import get from 'axios';

import { writeDataToFile } from './_utils';
import { WPQueryOptions, WPAuthHeaders, Question } from '../types/types';
import {
    _delimiter,
    WP_HOST,
    WP_REST_API_USER,
    WP_REST_API_PW,
    WP_MIGRATION_ENDPOINT,
    wpRestApiRequireAuth,
    wpEndpoints,
    questionTypes,
    pageSize,
} from './constants';

// base WordPress REST API endpoint
const wordpressApiBasePath = `https://${WP_HOST}/wp-json/`;

export async function fetchWordpressData(fetchAll = false) {
    console.log(_delimiter);
    console.log(`Fetching WordPress API data`);
    console.log(_delimiter);

    // Loop over our content types and fetch data from the WP REST API
    for (const [key] of Object.entries(wpEndpoints)) {
        if (key === 'questions') {
            for (const questionType of questionTypes) {
                const baseUrl = `${wordpressApiBasePath}${WP_MIGRATION_ENDPOINT}${key}`;
                const wpAuthHeaders = getWpRequestConfig(wpRestApiRequireAuth);
                const allData = await fetchAllDataRecursive(
                    [],
                    { baseUrl, questionType, page: 1, pageSize },
                    wpAuthHeaders,
                    fetchAll
                );
                const subDir = fetchAll ? 'full' : 'test';
                writeDataToFile(allData, subDir, questionType);
            }
        } else {
            // const url = `${wordpressApiBasePath}${key}?&per_page=${pageSize}&page=1`;
            // const data = await fetchData(url);
            // writeDataToFile(data, key);
        }
    }
}

async function fetchAllDataRecursive(
    currentData: Question[] = [],
    { baseUrl, questionType, page, pageSize }: WPQueryOptions,
    wpAuthHeaders: WPAuthHeaders,
    fetchAll: boolean
) {
    const size = fetchAll ? pageSize : 5;
    const { questions } = await fetchSinglePageData({ baseUrl, questionType, page, pageSize: size }, wpAuthHeaders);
    const newData = [...currentData, ...questions];
    if (fetchAll && questions.length === pageSize) {
        const nextPage = page + 1;
        return fetchAllDataRecursive(
            newData,
            { baseUrl, questionType, page: nextPage, pageSize },
            wpAuthHeaders,
            fetchAll
        );
    }
    return newData;
}

async function fetchSinglePageData(
    { baseUrl, questionType, page, pageSize }: WPQueryOptions,
    wpAuthHeaders: WPAuthHeaders
) {
    const requestUrl = `${baseUrl}?question_type=${questionType}&page=${page}&per_page=${pageSize}`;
    console.log(`Fetching page ${page} of ${questionType} questions`);
    const { data } = await get(requestUrl, wpAuthHeaders);
    try {
        return data;
    } catch (error) {
        console.log(error);
    }
}

function getWpRequestConfig(requireAuth: boolean): WPAuthHeaders {
    if (requireAuth) {
        return {
            headers: {
                Authorization: `Basic ${Buffer.from(`${WP_REST_API_USER}:${WP_REST_API_PW}`).toString('base64')}`,
            },
        };
    }
    return {};
}

// invoke the main function
// fetchWordpressData(true);
