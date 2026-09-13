import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import path from "node:path";
import { mkdir } from "node:fs/promises";

export class FileService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error("R2 environment variables are missing");
    }

    this.bucketName = process.env.R2_BUCKET_NAME!;

    this.s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async download(objectKey: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    });

    const response = await this.s3Client.send(command);

    if (!response.Body) {
      throw new Error("File body is empty");
    }

    const tempDirectory = path.resolve("temp");

    await mkdir(tempDirectory, { recursive: true });

    const fileName = path.basename(objectKey);
    const filePath = path.join(tempDirectory, fileName);

    const fileStream = createWriteStream(filePath);

    await new Promise<void>(async (resolve, reject) => {
      try {
        await (response.Body as Readable).pipe(fileStream);

        fileStream.on("finish", resolve);
        fileStream.on("error", reject);
      } catch (error) {
        reject(error);
      }
    });

    return filePath;
  }
}
