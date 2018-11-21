This project makes it easy to capture images from a webcam, send them to a Sagemaker Inference Endpoint, and view the results.

The Sagemaker Endpoint inference is proxied via a lambda function and an API gateway.

## Setup

- `amplify init`
- `amplify add auth` (accept default args, allow unauthenticated users if you want) 
- `amplify add api` (select REST, create one path `POST` to `/classify`, give auth and unauthed users read/write access, paste the contents of `lambda/app.js` into the `app.js` that Amplify makes for you) 
- `amplify push`
- `yarn install`
- Find the IAM role created by Amplify to run the Lambda function -- look in `amplify/backend/function/.../*-cloudformation-template.json` for the role name. 
- In the AWS IAM console, edit the role from the step above and add the following policy to it:
```
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "VisualEditor0",
                "Effect": "Allow",
                "Action": "sagemaker:InvokeEndpoint",
                "Resource": "*"
            }
        ]
    }
```
## Running the app
- `yarn start`
