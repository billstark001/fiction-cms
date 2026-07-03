import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  type HeadObjectCommandOutput,
  PutObjectCommand,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { PutS3AssetInput, PutS3TextInput, S3ObjectInfo, S3Runtime, S3UploadTicket } from './types.js';

function publicUrl(runtime: S3Runtime, key: string): string | undefined {
  if (!runtime.publicBaseUrl) return undefined;
  return `${runtime.publicBaseUrl.replace(/\/$/, '')}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

function mapHead(runtime: S3Runtime, key: string, value: HeadObjectCommandOutput): S3ObjectInfo {
  return {
    key,
    publicUrl: publicUrl(runtime, key),
    mime: value.ContentType,
    sizeBytes: value.ContentLength,
    etag: value.ETag,
    lastModified: value.LastModified?.toISOString(),
    metadata: value.Metadata ?? {},
  };
}

async function streamToString(body: unknown): Promise<string> {
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (body instanceof Uint8Array) return Buffer.from(body).toString('utf8');
  const stream = body as AsyncIterable<Uint8Array>;
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

export async function putS3Text(runtime: S3Runtime, input: PutS3TextInput): Promise<S3ObjectInfo> {
  await runtime.client.send(
    new PutObjectCommand({
      Bucket: runtime.bucket,
      Key: input.key,
      Body: input.content,
      ContentType: input.contentType ?? 'text/plain; charset=utf-8',
      Metadata: input.metadata,
    }),
  );
  return headS3Object(runtime, input.key);
}

export async function getS3Text(runtime: S3Runtime, key: string): Promise<{ content: string; info: S3ObjectInfo }> {
  const output = await runtime.client.send(new GetObjectCommand({ Bucket: runtime.bucket, Key: key }));
  const content = await streamToString(output.Body);
  return {
    content,
    info: {
      key,
      publicUrl: publicUrl(runtime, key),
      mime: output.ContentType,
      sizeBytes: output.ContentLength,
      etag: output.ETag,
      lastModified: output.LastModified?.toISOString(),
      metadata: output.Metadata ?? {},
    },
  };
}

export async function putS3Asset(runtime: S3Runtime, input: PutS3AssetInput): Promise<S3ObjectInfo> {
  await runtime.client.send(
    new PutObjectCommand({
      Bucket: runtime.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType ?? 'application/octet-stream',
      Metadata: {
        ...(input.kind ? { kind: input.kind } : {}),
        ...(input.metadata ?? {}),
      },
    }),
  );
  return headS3Object(runtime, input.key);
}

export async function headS3Object(runtime: S3Runtime, key: string): Promise<S3ObjectInfo> {
  const head = await runtime.client.send(new HeadObjectCommand({ Bucket: runtime.bucket, Key: key }));
  return mapHead(runtime, key, head);
}

export async function deleteS3Object(runtime: S3Runtime, key: string): Promise<void> {
  await runtime.client.send(new DeleteObjectCommand({ Bucket: runtime.bucket, Key: key }));
}

export async function createPresignedPutUrl(
  runtime: S3Runtime,
  input: { key: string; contentType?: string; expiresInSeconds?: number; metadata?: Record<string, string> },
): Promise<S3UploadTicket> {
  const commandInput: PutObjectCommandInput = {
    Bucket: runtime.bucket,
    Key: input.key,
    ContentType: input.contentType,
    Metadata: input.metadata,
  };
  const uploadUrl = await getSignedUrl(runtime.client, new PutObjectCommand(commandInput), {
    expiresIn: input.expiresInSeconds ?? 300,
  });
  return {
    uploadUrl,
    method: 'PUT',
    bucket: runtime.bucket,
    key: input.key,
    publicUrl: publicUrl(runtime, input.key),
    headers: input.contentType ? { 'content-type': input.contentType } : {},
  };
}
