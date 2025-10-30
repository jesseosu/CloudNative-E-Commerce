import {
  Stack,
  StackProps,
  CfnOutput,
  Duration,
  RemovalPolicy,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as path from 'path';

export class EcommerceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Cognito
    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      standardAttributes: { email: { required: true, mutable: false } },
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      authFlows: { userPassword: true, userSrp: true },
    });

    // DynamoDB Tables
    const productTable = new dynamodb.Table(this, 'ProductTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING }, // pk = PRODUCT#<id>
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },      // sk = META or VARIANT#
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const userTable = new dynamodb.Table(this, 'UserTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING }, // pk = USER#<sub>
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },      // sk = PROFILE / ADDRESS#
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const cartTable = new dynamodb.Table(this, 'CartTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING }, // pk = CART#<sub>
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },      // sk = ITEM#<productId>
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const orderTable = new dynamodb.Table(this, 'OrderTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING }, // pk = ORDER#<id>
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },      // sk = USER#<sub>
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Kinesis stream for analytics events
    const analyticsStream = new kinesis.Stream(this, 'AnalyticsStream', {
      streamMode: kinesis.StreamMode.ON_DEMAND,
      retentionPeriod: Duration.hours(24),
    });

    // Lambda helpers
    const lambdaDefaults: Partial<lambda.NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { externalModules: ['@aws-sdk/*'] },
      environment: {
        PRODUCT_TABLE: productTable.tableName,
        USER_TABLE: userTable.tableName,
        CART_TABLE: cartTable.tableName,
        ORDER_TABLE: orderTable.tableName,
        ANALYTICS_STREAM: analyticsStream.streamName,
      },
    };

    // Product service
    const productFn = new lambda.NodejsFunction(this, 'ProductFn', {
      entry: path.join(__dirname, '../../services/product/src/handler.ts'),
      ...lambdaDefaults,
    });
    productTable.grantReadWriteData(productFn);

    // User service
    const userFn = new lambda.NodejsFunction(this, 'UserFn', {
      entry: path.join(__dirname, '../../services/user/src/handler.ts'),
      ...lambdaDefaults,
    });
    userTable.grantReadWriteData(userFn);

    // Cart service
    const cartFn = new lambda.NodejsFunction(this, 'CartFn', {
      entry: path.join(__dirname, '../../services/cart/src/handler.ts'),
      ...lambdaDefaults,
    });
    cartTable.grantReadWriteData(cartFn);
    productTable.grantReadData(cartFn);

    // Checkout service
    const checkoutFn = new lambda.NodejsFunction(this, 'CheckoutFn', {
      entry: path.join(__dirname, '../../services/checkout/src/handler.ts'),
      ...lambdaDefaults,
    });
    orderTable.grantReadWriteData(checkoutFn);
    cartTable.grantReadWriteData(checkoutFn);

    // Analytics ingest
    const analyticsFn = new lambda.NodejsFunction(this, 'AnalyticsFn', {
      entry: path.join(__dirname, '../../services/analytics/src/handler.ts'),
      ...lambdaDefaults,
    });
    analyticsStream.grantWrite(analyticsFn);

    // API Gateway with Cognito authorizer
    const api = new apigw.RestApi(this, 'HttpApi', {
      restApiName: 'ecommerce-api',
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: ['Authorization', 'Content-Type']
      }
    });

    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'CognitoAuth', {
      cognitoUserPools: [userPool],
    });

    // Routes
    const product = api.root.addResource('product');
    product.addMethod('GET', new apigw.LambdaIntegration(productFn)); // /product?id=123
    product.addMethod('POST', new apigw.LambdaIntegration(productFn), { // create/update
      authorizer, authorizationType: apigw.AuthorizationType.COGNITO
    });

    const products = api.root.addResource('products');
    products.addMethod('GET', new apigw.LambdaIntegration(productFn)); // list

    const user = api.root.addResource('user');
    user.addMethod('GET', new apigw.LambdaIntegration(userFn), {
      authorizer, authorizationType: apigw.AuthorizationType.COGNITO
    });

    const cart = api.root.addResource('cart');
    cart.addMethod('GET', new apigw.LambdaIntegration(cartFn), {
      authorizer, authorizationType: apigw.AuthorizationType.COGNITO
    });
    cart.addMethod('POST', new apigw.LambdaIntegration(cartFn), {
      authorizer, authorizationType: apigw.AuthorizationType.COGNITO
    });
    cart.addMethod('DELETE', new apigw.LambdaIntegration(cartFn), {
      authorizer, authorizationType: apigw.AuthorizationType.COGNITO
    });

    const checkout = api.root.addResource('checkout');
    checkout.addMethod('POST', new apigw.LambdaIntegration(checkoutFn), {
      authorizer, authorizationType: apigw.AuthorizationType.COGNITO
    });

    const analytics = api.root.addResource('analytics');
    analytics.addMethod('POST', new apigw.LambdaIntegration(analyticsFn)); // no auth for demo

    // Static hosting for SPA
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI');
    siteBucket.grantRead(new iam.CanonicalUserPrincipal(oai.cloudFrontOriginAccessIdentityS3CanonicalUserId));

    const distribution = new cloudfront.Distribution(this, 'SpaDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(siteBucket, { originAccessIdentity: oai }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: Duration.seconds(0) }
      ]
    });

    new CfnOutput(this, 'ApiUrl', { value: api.url });
    new CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new CfnOutput(this, 'SpaUrl', { value: `https://${distribution.domainName}` });
  }
}
