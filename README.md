This project makes it easy to capture images from a webcam, send them to a Sagemaker Inference Endpoint, and view the results.

The Sagemaker Endpoint inference is proxied via a lambda function and an API gateway.

## Setup

- `amplify init`
- `amplify add auth` (accept default args, allow unauthenticated users if you want) 
- `amplify add api` (select REST, create one path `POST` to `/classify`, give auth and unauthed users read/write access, paste the contents of `lambda/app.js` into the `app.js` that Amplify makes for you) 
- `amplify push`
- `yarn install`

## Running the app
- `yarn start`