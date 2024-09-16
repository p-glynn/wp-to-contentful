// Package Imports
import contentful, { Environment } from 'contentful-management';
import get from 'axios';
import { writeFile } from 'fs';
// import TurndownService from 'turndown';
import { configDotenv } from 'dotenv';

import { WPQueryOptions, WPAuthHeaders, WPResponse } from '../types/types';

// import project specific configuration from .env file
configDotenv();
const { HOST, CTF_TOKEN, CTF_ENV, CTF_SPACE_ID, WP_REST_API_USER, WP_REST_API_PW, MIGRATION_ENDPOINT } = process.env;

// Global vars

// base WordPress REST API endpoint
const wordpressApiBasePath = `https://${HOST}/wp-json/`;

// make terminal log output easier to read
const _delimiter = `-------`;

/**
 * ----------------------------------------------
 * Project specific configuration
 */

const wpRestApiRequireAuth = false;
// const localeString = 'en-US';

// for pagination of WP REST API response data (if needed)
const pageSize = 25;

/**
 * API Endpoints that we'd like to receive data from
 * (e.g. /wp-json/wp/v2/${key})
 */
const wpEndpoints = {
    // posts: [],
    // tags: [],
    // categories: [],
    // media: [],
    questions: [],
};

const questionTypes = ['angiogram', 'ecg', 'echo', 'cv_image'];

/* *
 * Main Migration Script.
 * ----------------------------------------------
 */

const runMigration = async () => {
    console.log(_delimiter);
    console.log(`Fetching WordPress API data`);
    console.log(_delimiter);

    // Loop over our content types and fetch data from the WP REST API
    for (const [key] of Object.entries(wpEndpoints)) {
        if (key === 'questions') {
            for (const questionType of questionTypes) {
                const baseUrl = `${wordpressApiBasePath}${MIGRATION_ENDPOINT}${key}`;
                const wpAuthHeaders = getWpRequestConfig(wpRestApiRequireAuth);
                const allData = await fetchAllData([], { baseUrl, questionType, page: 1, pageSize }, wpAuthHeaders);
                writeDataToFile(allData, questionType);
            }
        } else {
            // const url = `${wordpressApiBasePath}${key}?&per_page=${pageSize}&page=1`;
            // const data = await fetchData(url);
            // writeDataToFile(data, key);
        }
    }
};
// url: string, questionType: string, page: number, pageSize: number
const fetchAllData = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentData: any[] = [],
    { baseUrl, questionType, page, pageSize }: WPQueryOptions,
    wpAuthHeaders: WPAuthHeaders
) => {
    const { questions } = await fetchSinglePageData({ baseUrl, questionType, page, pageSize }, wpAuthHeaders);
    const newData = [...currentData, ...questions];
    if (questions.length === pageSize) {
        const nextPage = page + 1;
        return fetchAllData(newData, { baseUrl, questionType, page: nextPage, pageSize }, wpAuthHeaders);
    }
    return newData;
};

const getWpRequestConfig = (requireAuth: boolean): WPAuthHeaders => {
    if (requireAuth) {
        return {
            headers: {
                Authorization: `Basic ${Buffer.from(`${WP_REST_API_USER}:${WP_REST_API_PW}`).toString('base64')}`,
            },
        };
    }
    return {};
};

const fetchSinglePageData = async (
    { baseUrl, questionType, page, pageSize }: WPQueryOptions,
    wpAuthHeaders: WPAuthHeaders
) => {
    const requestUrl = `${baseUrl}?question_type=${questionType}&page=${page}&per_page=${pageSize}`;
    console.log(`Fetching page ${page} of ${questionType} questions`);
    const { data } = await get(requestUrl, wpAuthHeaders);
    try {
        return data;
    } catch (error) {
        console.log(error);
    }
};

/**
 * Get our entire API response and filter it down to only show content that we want to include
 */
const mapData = () => {
    // Get WP posts from API object

    // Loop over our conjoined data structure and append data types to each child.
    for (const [index, [key, value]] of Object.entries(Object.entries(wpData))) {
        apiData[index].endpoint = key;
    }

    console.log(`Reducing API data to only include fields we want`);
    const apiPosts = getApiDataType('posts')[0];
    // Loop over posts - note: we probably /should/ be using .map() here.
    for (const [key, postData] of Object.entries(apiPosts.data)) {
        console.log(`Post Data: ${postData}`);
        console.log(`Parsing ${postData.slug}`);
        /**
         * Create base object with only limited keys
         * (e.g. just 'slug', 'categories', 'title') etc.
         *
         * The idea here is that the key will be your Contentful field name
         * and the value be the WP post value. We will later match the keys
         * used here to their Contentful fields in the API.
         */
        // let fieldData = {
        //   id: postData.id,
        //   type: postData.type,
        //   postTitle: postData.title.rendered,
        //   slug: postData.slug,
        //   content: postData.content.rendered,
        //   publishDate: postData.date_gmt + '+00:00',
        //   featuredImage: postData.featured_media,
        //   tags: getPostLabels(postData.tags, 'tags'),
        //   categories: getPostLabels(postData.categories, 'categories'),
        //   contentImages: getPostBodyImages(postData)
        // }

        // wpData.posts.push(fieldData)
    }

    // console.log(`...Done!`);
    // console.log(_delimiter);

    // writeDataToFile(wpData, 'wpPosts');
    // createForContentful();
};

// function getPostBodyImages(postData) {
//     // console.log(`- Getting content images`)
//     let imageRegex = /<img\s[^>]*?src\s*=\s*['\"]([^'\"]*?)['\"][^>]*?>/g
//     let bodyImages = []

//     if (postData.featured_media > 0) {
//         let mediaData = getApiDataType(`media`)[0];

//         let mediaObj = mediaData.data.filter(obj => {
//             if (obj.id === postData.featured_media) {
//                 return obj
//             }
//         })[0];

//         bodyImages.push({
//             link: mediaObj.source_url,
//             description: mediaObj.alt_text,
//             title: mediaObj.alt_text,
//             mediaId: mediaObj.id,
//             postId: mediaObj.post,
//             featured: true
//         })
//     }

//     while (foundImage = imageRegex.exec(postData.content.rendered)) {
//         let alt = postData.id

//         if (foundImage[0].includes('alt="')) {
//             alt = foundImage[0].split('alt="')[1].split('"')[0] || ''
//         }

//         bodyImages.push({
//             link: foundImage[1],
//             description: alt,
//             title: alt,
//             postId: postData.id,
//             featured: false
//         })
//     }
//     return bodyImages
// }

// function getPostLabels(postItems, labelType) {
//     let labels = []
//     let apiTag = getApiDataType(labelType)[0];

//     for (const labelId of postItems) {
//         let labelName = apiTag.data.filter(obj => {
//             if (obj.id === labelId) {
//                 return obj.name
//             }
//         });

//         labels.push(labelName[0].name)
//     }

//     return labels
// }

// /**
//  * Helper function to get a specific data tree for a type of resource.
//  * @param {String} resourceName - specific type of WP endpoint (e.g. posts, media)
//  */
// function getApiDataType(resourceName) {
//     let apiType = apiData.filter(obj => {
//         if (obj.endpoint === resourceName) {
//             return obj
//         }
//     });
//     return apiType
// }

/**
 * Write all exported WP data to its own JSON file.
 * @param {Object} dataTree - JSON body of WordPress data
 * @param {string} dataType - type of WordPress API endpoint.
 */
function writeDataToFile(dataTree: object, dataType: string) {
    console.log(`Writing ${dataType} data to file`);

    writeFile(`./output/${dataType}.json`, JSON.stringify(dataTree, null, 2), (err) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(`...Done!`);
        console.log(_delimiter);
    });
}

/**
 * Instantiate Contentful Client
 */
const ctfClient = contentful.createClient({
    accessToken: CTF_TOKEN || '',
});

/**
 * Contentful API Call
 */
const createForContentful = async () => {
    const space = await ctfClient.getSpace(CTF_SPACE_ID || '');
    const environment = await space.getEnvironment(CTF_ENV || 'master');
    try {
        // buildContentfulAssets(environment);
    } catch (error) {
        console.error(error);
    }
    // // .then((space) => space.getEnvironment(CTF_ENV || 'master'))
    // .then((environment) => {

    // })
    // .catch((error) => {
    //     console.log(error)
    //     return error
    // })
};

/**
 * Build data trees for Contentful assets.
 * @param {String} environment - name of Contentful environment.
 */
function buildContentfulAssets(environment: Environment) {
    const assetPromises = [];

    console.log('Building Contentful Asset Objects');

    // For every image in every post, create a new asset.
    for (const [index, wpPost] of wpData.posts.entries()) {
        for (const [imgIndex, contentImage] of wpPost.contentImages.entries()) {
            const assetObj = {
                title: {
                    'en-GB': contentImage.title,
                },
                description: {
                    'en-GB': contentImage.description,
                },
                file: {
                    'en-GB': {
                        contentType: 'image/jpeg',
                        fileName: contentImage.link.split('/').pop(),
                        upload: encodeURI(contentImage.link),
                    },
                },
            };

            assetPromises.push(assetObj);
        }
    }

    const assets = [];

    console.log(`Creating Contentful Assets...`);
    console.log(_delimiter);

    // getAndStoreAssets()

    createContentfulAssets(environment, assetPromises, assets).then((result) => {
        console.log(`...Done!`);
        console.log(_delimiter);

        getAndStoreAssets(environment, assets);
    });
}

// /**
//  * Fetch all published assets from Contentful and store in a variable.
//  * @param {String} environment - name of Contentful Environment.
//  * @param {Array} assets - Array to store assets in.
//  */
// function getAndStoreAssets(environment, assets) {
//     console.log(`Storing asset URLs in a global array to use later`)
//     // Not supported with JS? Easier to get all assets and support
//     get(`https://api.contentful.com/spaces/${ctfData.spaceId}/environments/${ctfData.environment}/public/assets`, {
//             headers: {
//                 'Authorization': `Bearer ${ctfData.accessToken}`
//             }
//         })
//         .then((result) => {
//             // console.log(result)
//             contentfulData.assets = []
//             for (const item of result.data.items) {
//                 contentfulData.assets.push(item.fields.file['en-GB'].url)
//             }

//             createContentfulPosts(environment, assets)

//         }).catch((err) => {
//             console.log(err)
//             return error
//         });
//     console.log(`...Done!`)
//     console.log(_delimiter)
// }

// /**
//  * Create a Promise to publish all assets.
//  * Note that, Timeout might not be needed here, but Contentful
//  * rate limits were being hit.
//  * @param {String} environment - Contentful Environment
//  * @param {Array} promises - Contentful Asset data trees
//  * @param {Array} assets - array to store Assets in
//  */
// function createContentfulAssets(environment, promises, assets) {
//     return Promise.all(
//         promises.map((asset, index) => new Promise(async resolve => {

//             let newAsset
//             // console.log(`Creating: ${post.slug['en-GB']}`)
//             setTimeout(() => {
//                 try {
//                     newAsset = environment.createAsset({
//                             fields: asset
//                         })
//                         .then((asset) => asset.processForAllLocales())
//                         .then((asset) => asset.publish())
//                         .then((asset) => {
//                             console.log(`Published Asset: ${asset.fields.file['en-GB'].fileName}`);
//                             assets.push({
//                                 assetId: asset.sys.id,
//                                 fileName: asset.fields.file['en-GB'].fileName
//                             })
//                         })
//                 } catch (error) {
//                     throw (Error(error))
//                 }

//                 resolve(newAsset)
//             }, 1000 + (5000 * index));
//         }))
//     );
// }

// /**
//  * For each WordPress post, build the data for a Contentful counterpart.
//  * @param {String} environment - Name of Contentful Environment.
//  * @param {Array} assets - array to store Assets in
//  */
// function createContentfulPosts(environment, assets) {
//     console.log(`Creating Contentful Posts...`)
//     console.log(_delimiter)

//     // let postFields = {}
//     /**
//      * Dynamically build our Contentful data object
//      * using the keys we built whilst reducing the WP Post data.alias
//      *
//      * Results:
//      *  postTitle: {
//      *    'en-GB': wpPost.postTitle
//      *   },
//      *  slug: {
//      *    'en-GB': wpPost.slug
//      *  },
//      */
//     let promises = []

//     for (const [index, post] of wpData.posts.entries()) {
//         let postFields = {}

//         for (let [postKey, postValue] of Object.entries(post)) {
//             // console.log(`postKey: ${postValue}`)
//             if (postKey === 'content') {
//                 postValue = turndownService.turndown(postValue)
//             }

//             /**
//              * Remove values/flags/checks used for this script that
//              * Contentful doesn't need.
//              */
//             let keysToSkip = [
//                 'id',
//                 'type',
//                 'contentImages'
//             ]

//             if (!keysToSkip.includes(postKey)) {
//                 postFields[postKey] = {
//                     'en-GB': postValue
//                 }
//             }

//             if (postKey === 'featuredImage' && postValue > 0) {
//                 let assetObj = assets.filter(asset => {
//                     if (asset.fileName === post.contentImages[0].link.split('/').pop()) {
//                         return asset
//                     }
//                 })[0];

//                 postFields.featuredImage = {
//                     'en-GB': {
//                         sys: {
//                             type: 'Link',
//                             linkType: 'Asset',
//                             id: assetObj.assetId
//                         }
//                     }
//                 }
//             }

//             // No image and Contentful will fail if value is '0', so remove.
//             if (postKey === 'featuredImage' && postValue === 0) {
//                 delete postFields.featuredImage
//             }
//         }
//         promises.push(postFields)
//     }

//     console.log(`Post objects created, attempting to create entries...`)
//     createContentfulEntries(environment, promises)
//         .then((result) => {
//             console.log(_delimiter);
//             console.log(`Done!`);
//             console.log(_delimiter);
//             console.log(`The migration has completed.`)
//             console.log(_delimiter);
//         });
// }

// /**
//  * For each post data tree, publish a Contentful entry.
//  * @param {String} environment - Name of Contentful Environment.
//  * @param {Array} promises - data trees for Contentful posts.
//  */
// function createContentfulEntries(environment, promises) {
//     return Promise.all(promises.map((post, index) => new Promise(async resolve => {

//         let newPost

//         console.log(`Attempting: ${post.slug['en-GB']}`)

//         setTimeout(() => {
//             try {
//                 newPost = environment.createEntry('blogPost', {
//                         fields: post
//                     })
//                     .then((entry) => entry.publish())
//                     .then((entry) => {
//                         console.log(`Success: ${entry.fields.slug['en-GB']}`)
//                     })
//             } catch (error) {
//                 throw (Error(error))
//             }

//             resolve(newPost)
//         }, 1000 + (5000 * index));
//     })));
// }

// /**
//  * Convert WordPress content to Contentful Rich Text
//  * Ideally we'd be using Markdown here, but I like the RichText editor 🤡
//  *
//  * Note: Abandoned because it did not seem worth the effort.
//  * Leaving this here in case anybody does decide to venture this way.
//  *
//  * @param {String} content - WordPress post content.
//  */
// function formatRichTextPost(content) {
//     // TODO: split  at paragraphs, create a node for each.
//     console.log(_delimiter)

//     // turndownService.remove('code')
//     let markdown = turndownService.turndown(content)

//     // console.log(_delimiter)
//     // console.log(markdown)

//     // let imageLinks = /!\[[^\]]*\]\((.*?)\s*("(?:.*[^"])")?\s*\)/g
//     // let imageRegex = /<img\s[^>]*?src\s*=\s*['\"]([^'\"]*?)['\"][^>]*?>/g

//     // while (foundImage = imageLinks.exec(markdown)) {
//     // console.log(foundImage[0])
//     // let alt = foundImage[0].split('alt="')[1].split('"')[0]
//     // }

//     /**
//      * https://www.contentful.com/developers/docs/concepts/rich-text/
//      */

//     /**
//      *     "expected": [
//             "blockquote",
//             "embedded-asset-block",
//             "embedded-entry-block",
//             "heading-1",
//             "heading-2",
//             "heading-3",
//             "heading-4",
//             "heading-5",
//             "heading-6",
//             "hr",
//             "ordered-list",
//             "paragraph",
//             "unordered-list"
//           ]
//      */

//     // let contentor = {
//     //   content: [
//     //     {
//     //       nodeType:"paragraph",
//     //       data: {},
//     //       content: [
//     //         {
//     //           value: content,
//     //           nodeType:"text",
//     //           marks: [],
//     //           data: {}
//     //         }
//     //       ]
//     //     },
//     //     // {
//     //     //   nodeType:"paragraph",
//     //     //   data: {},
//     //     //   content: [
//     //     //     {
//     //     //       value: "lorem hello world two",
//     //     //       nodeType:"text",
//     //     //       marks: [],
//     //     //       data: {}
//     //     //     }
//     //     //   ]
//     //     // },
//     //   ],
//     //   data: {},
//     //   nodeType: 'document'
//     // };

//     return markdown
// }

/**
 * Markdown / Content conversion functions.
 */
// const turndownService = new TurndownService({
//     codeBlockStyle: 'fenced',
// });

// /**
//  * Convert HTML codeblocks to Markdown codeblocks.
//  */
// turndownService.addRule('fencedCodeBlock', {
//     filter: function (node, options) {
//         return (
//             options.codeBlockStyle === 'fenced' &&
//             node.nodeName === 'PRE' &&
//             node.firstChild &&
//             node.firstChild.nodeName === 'CODE'
//         )
//     },
//     replacement: function (content, node, options) {
//         let className = node.firstChild.getAttribute('class') || ''
//         let language = (className.match(/language-(\S+)/) || [null, ''])[1]

//         return (
//             '\n\n' + options.fence + language + '\n' +
//             node.firstChild.textContent +
//             '\n' + options.fence + '\n\n'
//         )
//     }
// })

// /**
//  * Convert inline HTML images to inline markdown image format.
//  */
// turndownService.addRule('replaceWordPressImages', {
//     filter: ['img'],
//     replacement: function (content, node, options) {
//         let assetUrl = contentfulData.assets.filter(asset => {
//             let assertFileName = asset.split('/').pop()
//             let nodeFileName = node.getAttribute('src').split('/').pop()

//             if (assertFileName === nodeFileName) {
//                 return asset
//             }
//         })[0];

//         return `![${node.getAttribute('alt')}](${assetUrl})`
//     }
// })

/**
 * call the main function to start the migration.
 * -----------------------------------------------------------------------------
 */
runMigration();
