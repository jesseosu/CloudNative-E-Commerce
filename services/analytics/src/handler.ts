import { KinesisClient, PutRecordCommand } from '@aws-sdk/client-kinesis';

const streamName = process.env.ANALYTICS_STREAM!;
const kin = new KinesisClient({});

const ok = (body: unknown) => ({ statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const bad = (msg: string, code=400) => ({ statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: msg }) });

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') return bad('method not allowed', 405);
  const body = JSON.parse(event.body||'{}');
  const partition = body.userSub ?? 'anonymous';
  await kin.send(new PutRecordCommand({ StreamName: streamName, PartitionKey: partition, Data: new TextEncoder().encode(JSON.stringify({ ...body, ts: Date.now() })) }));
  return ok({ accepted: true });
};
