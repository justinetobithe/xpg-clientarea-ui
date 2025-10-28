import { Storage } from '@google-cloud/storage';
import path from 'path';

const keyPath = path.resolve('/src/firebase.js');
process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;

const storage = new Storage();
const bucket = storage.bucket('xpg-system.appspot.com');

const corsConfig = [
    {
        origin: ['https://clientarea.xpg.live'],
        method: ['GET', 'HEAD', 'OPTIONS'],
        maxAgeSeconds: 3600,
    },
];

async function setCors() {
    await bucket.setCorsConfiguration(corsConfig);
    console.log('CORS settings updated!');
}

setCors().catch(console.error);
