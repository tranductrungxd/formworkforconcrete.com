import { CopyObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface PresignedPost {
  url: string;
  fields: Record<string, string>;
}

/** Everything the handler needs from S3, so tests can swap in a fake. */
export interface Store {
  putJson(key: string, value: unknown): Promise<void>;
  getJson<T>(key: string): Promise<T | null>;
  head(key: string): Promise<{ size: number } | null>;
  copy(from: string, to: string): Promise<void>;
  /** Browser upload straight to S3. S3 itself enforces the size range, so the bytes never touch Lambda. */
  presignPost(key: string, maxBytes: number, expiresSeconds: number): Promise<PresignedPost>;
  presignGet(key: string, fileName: string, expiresSeconds: number): Promise<string>;
}

const missing = (e: unknown) => e instanceof Error && (e.name === "NoSuchKey" || e.name === "NotFound");

export function s3Store(bucket: string): Store {
  const client = new S3Client({});

  return {
    async putJson(key, value) {
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: JSON.stringify(value), ContentType: "application/json" }));
    },

    async getJson<T>(key: string) {
      try {
        const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        return JSON.parse((await res.Body?.transformToString()) ?? "null") as T;
      } catch (e) {
        if (missing(e)) return null;
        throw e;
      }
    },

    async head(key) {
      try {
        const res = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        return { size: res.ContentLength ?? 0 };
      } catch (e) {
        if (missing(e)) return null;
        throw e;
      }
    },

    async copy(from, to) {
      const source = `${bucket}/${from.split("/").map(encodeURIComponent).join("/")}`;
      await client.send(new CopyObjectCommand({ Bucket: bucket, Key: to, CopySource: source }));
    },

    async presignPost(key, maxBytes, expiresSeconds) {
      const { url, fields } = await createPresignedPost(client, {
        Bucket: bucket,
        Key: key,
        Conditions: [["content-length-range", 1, maxBytes]],
        Expires: expiresSeconds,
      });
      return { url, fields };
    },

    presignGet(key, fileName, expiresSeconds) {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      });
      return getSignedUrl(client, command, { expiresIn: expiresSeconds });
    },
  };
}
