# A script to migrate posts from WordPress to Contentful

This is a script that will export all posts from WordPress using the Rest API and import them into Contentful using the Content Management API.

I've used this script for my own personal site and decided to share it and document my process used to develop it so people can learn from it. The basis of the script is intended to be expanded on for your own specific purpose, but you can use the script as-is with a few minor configurations.

Full write-up can be found here:
https://ashcroft.dev/blog/script-migrate-wordpress-posts-contentful/ (NOTE: This fork modifies Jon Ashcroft's work to use TypeScript).

## How to use the script

This script will run in the terminal via TSX / Node. You need to have [npm installed]('https://www.npmjs.com/get-npm').

Steps to run:

### Clone The Repo

`git clone git@github.com:p-glynn/wp-to-contentful.git`

Inside your new folder, install the packages required to run:

```bash
npm install
```

### Add your details

Create a `.env` file. You will need the following keys in your `.env` file:

-   `HOST`: the hostname of your wordpress site
-   `CTF_TOKEN`: generated via Contentful admin panel
-   `CTF_ENV`: generated via Contentful admin panel
-   `CTF_SPACE_ID`: generated via Contentful admin panel
-   `WP_REST_API_USER` (optional: required if your WP REST API endpoints are protected - see docs [here](https://developer.wordpress.org/rest-api/frequently-asked-questions/#require-authentication-for-all-requests) and [here](https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/))
-   WP_REST_API_PW (optional: see above)

Open up `migration.ts`, you'll need to make some modifications:

(necessary modifications go here - post type?)

### Run the script

```bash
npx tsx migration.ts
```

**IMPORTANT**: There is no sandbox or test environment with this script. If you run this script, it will immediately attempt to publish your new posts and assets - I am not responsible for anything that goes wrong.
