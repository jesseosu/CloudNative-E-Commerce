import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.PRODUCT_TABLE!;

const ok = (body: unknown) => ({ statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const bad = (msg: string, code=400) => ({ statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: msg }) });

export const handler = async (event: any) => {
  const method = event.httpMethod;
  const path = event.resource;
  if (method === 'GET' && path.endsWith('/product')) {
    const id = event.queryStringParameters?.id;
    if (!id) return bad('missing id');
    const pk = `PRODUCT#${id}`;
    const res = await client.send(new GetCommand({ TableName: TABLE, Key: { pk, sk: 'META' } }));
    return res.Item ? ok(res.Item) : bad('not found', 404);
  }
  if (method === 'GET' && path.endsWith('/products')) {
    // simple full scan replacement using a PK prefix via GSI would be ideal; here we use a Query on begins_with
    const res = await client.send(new QueryCommand({
      TableName: TABLE,
      IndexName: undefined,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': 'PRODUCT_INDEX' },
    })).catch(()=>({ Items: [] }));
    return ok(res.Items ?? []);
  }
  if (method === 'POST' && path.endsWith('/product')) {
    const body = JSON.parse(event.body || '{}');
    const id = body.id ?? randomUUID();
    const pk = `PRODUCT#${id}`;
    const item = {
      pk, sk: 'META', id, title: body.title, price: Number(body.price||0), stock: Number(body.stock||0), image: body.image,
    };
    await client.send(new PutCommand({ TableName: TABLE, Item: item }));
    // maintain a cheap index row for list; in real app, use GSI
    await client.send(new PutCommand({ TableName: TABLE, Item: { pk: 'PRODUCT_INDEX', sk: `PRODUCT#${id}`, id, title: item.title, price: item.price, image: item.image, stock: item.stock } }));
    return ok(item);
  }
  if (method === 'POST' && path.endsWith('/products')) {
    const body = JSON.parse(event.body || '[]');
    for (const b of body) {
      const id = b.id ?? randomUUID();
      const pk = `PRODUCT#${id}`;
      const item = { pk, sk: 'META', id, title: b.title, price: Number(b.price||0), stock: Number(b.stock||0), image: b.image };
      await client.send(new PutCommand({ TableName: TABLE, Item: item }));
      await client.send(new PutCommand({ TableName: TABLE, Item: { pk: 'PRODUCT_INDEX', sk: `PRODUCT#${id}`, id: item.id, title: item.title, price: item.price, image: item.image, stock: item.stock } }));
    }
    return ok({ inserted: body.length });
  }
  if (method === 'PATCH' && path.endsWith('/product')) {
    const body = JSON.parse(event.body||'{}');
    if (!body.id) return bad('missing id');
    const pk = `PRODUCT#${body.id}`;
    await client.send(new UpdateCommand({
      TableName: TABLE,
      Key: { pk, sk: 'META' },
      UpdateExpression: 'SET title = :t, price = :p, stock = :s',
      ExpressionAttributeValues: { ':t': body.title, ':p': Number(body.price), ':s': Number(body.stock) }
    }));
    return ok({ updated: body.id });
  }
  return bad('route not found', 404);
};
