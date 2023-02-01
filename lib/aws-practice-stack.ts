import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime, LayerVersion} from "aws-cdk-lib/aws-lambda";

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsPracticeStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        const layer =
            LayerVersion.fromLayerVersionArn(this, 'merloc-layer',
                'arn:aws:lambda:eu-central-1:269863060030:layer:merloc-gatekeeper:26')
        new NodejsFunction(
            this,
            `test-function`,
            {
                functionName: `test-function`,
                entry: 'src/handlers/test-function.js',
                handler: `handler`,
                memorySize: 1024,
                runtime: Runtime.NODEJS_16_X,
                layers: [layer],
                environment: {
                    "AWS_LAMBDA_EXEC_WRAPPER": "/opt/extensions/merloc-gatekeeper-ext/bootstrap",
                    "MERLOC_BROKER_URL": "wss://szmglosakb.execute-api.eu-central-1.amazonaws.com/dev",
                    "MERLOC_DEBUG_ENABLE": "true",
                    "MERLOC_SAM_FUNCTION_NAME": "test-function"
                }
            },
        );
    }
}
