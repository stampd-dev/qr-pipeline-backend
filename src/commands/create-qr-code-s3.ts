import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as QRCode from "qrcode";

/**
 * Generate a printer-friendly QR code PNG for a given URL
 * and upload it to S3 at the provided key.
 */
export const generateAndUploadQrCode = async ({
  referalCode,
  client,
  bucketName,
}: {
  referalCode: string;
  client: S3Client;
  bucketName: string;
}) => {
  // 1) Generate QR code PNG (high-res, good error correction)
  //    - PNG is the most common printer-friendly format
  //    - width ~1024px gives good print quality for small physical items
  const pngBuffer = await QRCode.toBuffer(
    `https://main.d19hohaefmsqg9.amplifyapp.com/?ref=${referalCode}`, //TODO: Add the correct URL after amplify deployment
    {
      type: "png",
      width: 1024,
      margin: 4,
      errorCorrectionLevel: "Q", // high reliability without going crazy
    }
  );

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: `qr-codes/${referalCode}.png`,
      Body: pngBuffer,
      ContentType: "image/png",
    })
  );
};
