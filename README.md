This project makes it easy to capture images from a webcam, send them to a Sagemaker Inference Endpoint, and view the results.

The Sagemaker Endpoint inference is proxied via a lambda function and an API gateway.

## Setup

These instructions use the AWS Amplify toolchain to easily provision resources in AWS. Follow the installation guide at https://aws-amplify.github.io/ before continuing.

- `npm install`
- `amplify init`
- `amplify add api` (select REST, create one path `POST` to `/classify`, allow unauthenticated access, paste the contents of `lambda/app.js` into the `app.js` that Amplify makes for you) 
- `amplify push`
- `amplify env pull`
- Find the IAM role created by Amplify to run the Lambda function -- look in `amplify/backend/function/.../*-cloudformation-template.json` for the role name. 
- In the AWS IAM console, edit the role from the step above and add the following policy to it (or copy just the statement and add it to the existing lambdaexecution policy):
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
- `npm start`
