import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.USER_TABLE!;

const ok = (body: unknown) => ({ statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const bad = (msg: string, code=400) => ({ statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: msg }) });

export const handler = async (event: any) => {
  const sub = event.requestContext?.authorizer?.claims?.sub;
  if (!sub) return bad('unauthorized', 401);
  const method = event.httpMethod;

  if (method === 'GET') {
    const pk = `USER#${sub}`;
    const res = await client.send(new GetCommand({ TableName: TABLE, Key: { pk, sk: 'PROFILE' } }));
    return ok(res.Item ?? { pk, sk: 'PROFILE', email: event.requestContext.authorizer.claims.email });
  }
  if (method === 'POST') {
    const body = JSON.parse(event.body || '{}');
    const pk = `USER#${sub}`;
    const item = { pk, sk: 'PROFILE', ...body };
    await client.send(new PutCommand({ TableName: TABLE, Item: item }));
    return ok(item);
  }
  return bad('method not allowed', 405);
};
