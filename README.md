# Amazon Cognito M2M Token Caching

In this article, we will cover how to cache Amazon Cognito M2M access tokens in an auth service to optimise performance and cost.

![image](./docs/images/header.png)

> Note: If you choose to deploy these resources you may be charged for usage.

You can find the associated article here: https://medium.com/@leejamesgilmore/amazon-cognito-m2m-token-caching-for-cost-optimisation-performance-74c876d6f4aa

### Generating a token

The following CURL command allows you to test generating an access token:

```
curl -X POST "https://your-api-gateway-url/oauth2/token" \
     -H "Authorization: Basic $(echo -n 'your-client-id:your-client-secret' | base64)" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials" \
     -d "scope=cars-service/create.order"
```

### Deploying the Solution

To deploy the solution do the following which will deploy the `develop` environment:

1. In the `lj-supreme-cars` folder run `npm i`.
2. In the `lj-supreme-cars` folder run the following `npm run deploy:develop`.

To remove the solution run the following:

1. In the `lj-supreme-cars` folder run the following `npm run remove:develop`.
