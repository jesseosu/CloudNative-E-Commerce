import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const CART_TABLE = process.env.CART_TABLE!;
const ORDER_TABLE = process.env.ORDER_TABLE!;

const ok = (body: unknown) => ({ statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const bad = (msg: string, code=400) => ({ statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: msg }) });

export const handler = async (event: any) => {
  const sub = event.requestContext?.authorizer?.claims?.sub;
  if (!sub) return bad('unauthorized', 401);
  if (event.httpMethod !== 'POST') return bad('method not allowed', 405);

  // load cart
  const pk = `CART#${sub}`;
  const cart = await ddb.send(new QueryCommand({ TableName: CART_TABLE, KeyConditionExpression: 'pk = :pk', ExpressionAttributeValues: { ':pk': pk } }));
  const items = cart.Items ?? [];
  if (items.length === 0) return bad('cart empty');

  // compute total
  const total = items.reduce((sum, it) => sum + Number(it.price) * Number(it.qty), 0);

  // mock payment: authorize if total <= 10000
  if (total > 10000) return bad('payment declined');

  const orderId = randomUUID();
  const order = { pk: `ORDER#${orderId}`, sk: `USER#${sub}`, id: orderId, userSub: sub, total, createdAt: new Date().toISOString(), items };
  await ddb.send(new PutCommand({ TableName: ORDER_TABLE, Item: order }));

  // clear cart
  for (const it of items) {
    await ddb.send(new DeleteCommand({ TableName: CART_TABLE, Key: { pk, sk: it.sk } }));
  }

  return ok({ orderId, total });
};
