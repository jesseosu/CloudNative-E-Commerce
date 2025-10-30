import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const CART_TABLE = process.env.CART_TABLE!;
const PRODUCT_TABLE = process.env.PRODUCT_TABLE!;

const ok = (body: unknown) => ({ statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const bad = (msg: string, code=400) => ({ statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: msg }) });

export const handler = async (event: any) => {
  const sub = event.requestContext?.authorizer?.claims?.sub;
  if (!sub) return bad('unauthorized', 401);
  const method = event.httpMethod;

  if (method === 'GET') {
    const pk = `CART#${sub}`;
    const res = await ddb.send(new QueryCommand({ TableName: CART_TABLE, KeyConditionExpression: 'pk = :pk', ExpressionAttributeValues: { ':pk': pk } }));
    return ok(res.Items ?? []);
  }
  if (method === 'POST') {
    const body = JSON.parse(event.body||'{}');
    const { productId, qty } = body;
    if (!productId || !qty) return bad('productId & qty required');
    // fetch product price
    const prod = await ddb.send(new GetCommand({ TableName: PRODUCT_TABLE, Key: { pk: `PRODUCT#${productId}`, sk: 'META' } }));
    if (!prod.Item) return bad('product not found', 404);
    const price = Number(prod.Item.price);
    const pk = `CART#${sub}`;
    const sk = `ITEM#${productId}`;
    const item = { pk, sk, productId, qty: Number(qty), price };
    await ddb.send(new PutCommand({ TableName: CART_TABLE, Item: item }));
    return ok(item);
  }
  if (method === 'DELETE') {
    const productId = event.queryStringParameters?.productId;
    if (!productId) return bad('productId required');
    const pk = `CART#${sub}`;
    await ddb.send(new DeleteCommand({ TableName: CART_TABLE, Key: { pk, sk: `ITEM#${productId}` } }));
    return ok({ removed: productId });
  }
  return bad('method not allowed', 405);
};
