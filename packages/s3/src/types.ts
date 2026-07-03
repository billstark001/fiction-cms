import type { S3Client } from '@aws-sdk/client-s3';
import type { Buffer } from 'node:buffer';
import type { AssetKind } from '@fiction-cms/common';

export interface S3Runtime {
  client: S3Client;
  bucket: string;
  publicBaseUrl?: string;
}

export interface S3ObjectInfo {
  key: string;
  publicUrl?: string;
  mime?: string;
  sizeBytes?: number;
  etag?: string;
  lastModified?: string;
  metadata: Record<string, string>;
}

export interface PutS3TextInput {
  key: string;
  content: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface PutS3AssetInput {
  key: string;
  body: Uint8Array | Buffer | string;
  kind?: AssetKind;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface S3UploadTicket {
  uploadUrl: string;
  method: 'PUT';
  bucket: string;
  key: string;
  publicUrl?: string;
  headers: Record<string, string>;
}
