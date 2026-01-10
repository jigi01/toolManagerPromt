import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const s3Client = new S3Client({
    region: process.env.YANDEX_STORAGE_REGION || 'ru-central1',
    endpoint: process.env.YANDEX_STORAGE_ENDPOINT || 'https://storage.yandexcloud.net',
    credentials: {
        accessKeyId: process.env.YANDEX_STORAGE_ACCESS_KEY_ID,
        secretAccessKey: process.env.YANDEX_STORAGE_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = process.env.YANDEX_STORAGE_BUCKET;

export const uploadFile = async (file, folder = 'tools') => {
    if (!file) return null;

    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExtension}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
    });

    try {
        await s3Client.send(command);
        // Yandex Storage public URL format
        const endpoint = process.env.YANDEX_STORAGE_ENDPOINT || 'https://storage.yandexcloud.net';
        return `${endpoint}/${BUCKET_NAME}/${fileName}`;
    } catch (error) {
        console.error('Error uploading file to S3:', error);
        throw new Error('Failed to upload file');
    }
};

export const deleteFile = async (fileUrl) => {
    if (!fileUrl) return;

    try {
        // Extract key from URL
        // URL format: https://storage.yandexcloud.net/bucket-name/folder/filename.ext
        const urlValues = fileUrl.split(`${BUCKET_NAME}/`);
        if (urlValues.length < 2) return;

        const key = urlValues[1];

        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        await s3Client.send(command);
    } catch (error) {
        console.error('Error deleting file from S3:', error);
        // Silent fail for delete or just log it
    }
};
