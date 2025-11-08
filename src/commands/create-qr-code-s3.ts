import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as QRCode from "qrcode";
import * as sharp from "sharp";

/**
 * Generate a styled QR code PNG with white background, yellow circle, and black border
 * and upload it to S3 at the provided key.
 *
 * Design specifications:
 * - Final image: 640x640 pixels
 * - White background
 * - Yellow circle (#f2ce54) with 14px black border
 * - QR code centered in the circle
 */
export const generateAndUploadQrCode = async ({
  referalCode,
  client,
  bucketName,
  batchId,
}: {
  referalCode: string;
  client: S3Client;
  bucketName: string;
  batchId: string;
}) => {
  const url = `https://main.d19hohaefmsqg9.amplifyapp.com/?ref=${referalCode}`;

  // Generate QR code at size that fits in the circle
  // Circle diameter: 640 - (14 * 2) = 612px
  // QR code size: 480px leaves ~66px margin on each side
  const qrCodeSize = 480;
  const qrCodeBuffer = await QRCode.toBuffer(url, {
    type: "png",
    width: qrCodeSize,
    margin: 2,
    errorCorrectionLevel: "Q", // high reliability
    color: {
      dark: "#000000", // Black QR code modules
      light: "#00000000", // Transparent background
    },
  });

  // Calculate positions
  const imageSize = 640;
  const borderWidth = 14;
  const circleRadius = (imageSize - borderWidth * 2) / 2; // 306px
  const circleCenter = imageSize / 2; // 320px
  const qrCodeOffset = (imageSize - qrCodeSize) / 2; // 80px

  // Create SVG for the circle with border
  const circleSvg = Buffer.from(
    `<svg width="${imageSize}" height="${imageSize}">
      <circle cx="${circleCenter}" cy="${circleCenter}" r="${circleRadius}" 
              fill="#f2ce54" stroke="#000000" stroke-width="${borderWidth}"/>
    </svg>`
  );

  // Create the final 640x640 image
  const finalImage = await sharp({
    create: {
      width: imageSize,
      height: imageSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }, // White background
    },
  })
    .composite([
      // Draw yellow circle with black border
      {
        input: circleSvg,
        top: 0,
        left: 0,
      },
      // Composite QR code centered in circle
      {
        input: qrCodeBuffer,
        top: qrCodeOffset,
        left: qrCodeOffset,
      },
    ])
    .png()
    .toBuffer();

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: `qr-codes/batch-${batchId}/${referalCode}.png`,
      Body: finalImage,
      ContentType: "image/png",
    })
  );
};
