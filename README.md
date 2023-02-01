# MerLoc

[Merloc](https://github.com/thundra-io/merloc)  is a live AWS Lambda function development and debugging tool. MerLoc allows you to run AWS Lambda functions on your local while they are still part of a flow in the AWS cloud remote.

Supported runtimes
-	Java
-	Go
-	Python
-	Node.js
-	.NET

### Configuration (Node.js)

1. Merloc deployment

    * Go to broker stack deploy folder ``cd merloc-broker/stack/deployment``
    * Start deploy by running ``PROFILE=dev ./deploy.sh``
    * Get and save output from deployment

      ``merloc-broker-stack-dev.merlocbrokerurloutputdev = wss://szmglosakb.execute-api.eu-central-1.amazonaws.com/dev``


2. [MerLoc GateKeeper](https://github.com/thundra-io/merloc-gatekeeper-aws-lambda-extension) -  Allows AWS Lambda functions to communicate with your local runtime through broker. Add MerLoc GateKeeper as AWS Lambda extension
   to your lambda function that you want to debug.
    * add GateKeeper layer to your lambda function in format ``arn:aws:lambda:${region}:269863060030:layer:merloc-gatekeeper:${version}``
    * add environment variables explained [here](https://github.com/thundra-io/merloc-gatekeeper-aws-lambda-extension)

   Example
    * AWS SAM
```yml
Resources:
  HelloWorldFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: test-function
      CodeUri: hello-world/
      Handler: app.lambdaHandler
      Runtime: nodejs14.x
      Layers:
        - arn:aws:lambda:eu-central-1:269863060030:layer:merloc-gatekeeper:26
      Environment:
        Variables:
          AWS_LAMBDA_EXEC_WRAPPER: "/opt/extensions/merloc-gatekeeper-ext/bootstrap"
          MERLOC_BROKER_URL: "wss://szmglosakb.execute-api.eu-central-1.amazonaws.com/dev"
          MERLOC_DEBUG_ENABLE: "true"
          MERLOC_SAM_FUNCTION_NAME: "test-function"
```
* AWS CDK
```ts
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


```

3. Local AWS Lambda runtime
    * Install merloc CLI with npm
        * NOTE - You can use merloc CLI only if you are working with Serverless Framework or AWS SAM. If you are using AWS CDK possible adjustments will be explained in the section [AWS CDK](#aws-cdk).
    * Specify **broker-url** that you saved from step *1c* and run the following command
      ``merloc -b wss://szmglosakb.execute-api.eu-central-1.amazonaws.com/dev -d``
    * You should see the message ``Initialization completed. MerLoc is ready!``
    * Invoke lambda function and you should see the message ``<function-name>  Debugger listening on ws://0.0.0.0:<debug-port-no>/<debug-session-id>``
    * Attach your debugger to ``<debug-port-no>`` on ``localhost``
    * Message ``<function-name>  Debugger attached`` is presented


•	If you want to enable reloading with new code changes pass ``-r``. You can apply your changes to AWS Lambda function live without need to deploy it.

``merloc -b wss://szmglosakb.execute-api.eu-central-1.amazonaws.com/dev -i sam-local -r``

If you change the code you should see the message ``Reloading…``, invoke your lambda function again and you should see execution with your changes.

### AWS CDK

When you run any merloc command you will probably get the error
``Unable to detect default invoker. Consider specifying invoker by options``, since MerLoc is meant only for Serverless Framework and AWS SAM.

#### How it works?
Invoker is chosen based on presented template:
* ``template.yml`` (SAM) - ``sam-local``
* ``serverless.yml`` (Serverless Framework) - ``serverless-local``

If you build your project with AWS CDK you don’t have any of them.
Workaround can be to
* create a template from cdk output manually
* configure merloc commands

Additional step  can be to [install AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) if you don’t have it installed.


#### Create a template from cdk output manually
* ``cdk synth`` will synthesize a stack defined in your app into a CloudFormation template in a json file in the cdk.out folder.
* you can run ``cdk synth`` and store the result in ``template.yml`` file
* ``cdk synth > template.yml``


Since template.yml is presented you can run the command to test your lambda function locally. Sam local will be recognized as invoker.

Disadvantage of this approach is that reload can not work since it runs ``sam build`` and ``template.yml`` has the old version. You can have new changes on your local but you should build the project and generate template.yml again. Automatic reload can not work.

#### Configure merloc commands
In this case invoker must be defined (``-i sam-local``)

Configuration:

``--sam-init <cmd>`` - command to be run initially once, default value is ``sam build``
instead of sam build, you would like to do the following
* compile your local changes (``npm run build``)
* synthesize your stack (``cdk synth``)
* run sam build with template path specified since default path is project root directory and cdk generate output in cdk.out folder
    * ``--sam-init 'npm run build && cdk synth && sam build -t cdk.out/${stackName}.template.json'``

``--sam-reload <cmd>`` - command to be run on hot-reload when changes are detected, default value is ``sam build``

* usually the same command will be used
    * ``--sam-reload 'npm run build && cdk synth && sam build -t cdk.out/${stackName}.template.json'``

``-w <paths...>`` - configure paths to files to be wathced for changes to trigger hot-reload automatically

* must be set because npm run build and cdk synth will change files. Since every change triggers reload this would
  lead to infinite reload. Because of that all .ts files can be watched except .d.ts files that will be generated after compilation

    * ``-w '**/**/*.ts' '!**/**/*.d.ts'``

So, the whole command should look like

`` merloc -b wss://szmglosakb.execute-api.eu-central-1.amazonaws.com/dev -i sam-local --sam-init 'npm run build && cdk synth && sam build -t cdk.out/Stack.template.json' --sam-reload 'npm run build && cdk synth && sam build -t cdk.out/Stack.template.json' -d -r -w '**/**/*.ts' '!**/**/*.d.ts'``
