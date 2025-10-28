import epsThumbnail from '../../assets/images/thumbnails/eps-icon.png';
import gifThumbnail from '../../assets/images/thumbnails/gif-icon.png';
import jpgThumbnail from '../../assets/images/thumbnails/jpg-icon.png';
import movThumbnail from '../../assets/images/thumbnails/mov-icon.png';
import pdfThumbnail from '../../assets/images/thumbnails/pdf-icon.png';
import pngThumbnail from '../../assets/images/thumbnails/png-icon.png';
import mp4Thumbnail from '../../assets/images/thumbnails/mp4-icon.png';
import webpThumbnail from '../../assets/images/thumbnails/webp-icon.png';
import psdThumbnail from '../../assets/images/thumbnails/psd-icon.png';
import wordThumbnail from '../../assets/images/thumbnails/word-icon.png';
import defaultThumbnail from '../../assets/images/thumbnails/file-icon.png';

export const extractFileInfo = (file) => {
    let fileName, extension;

    if (file.name) {
        fileName = file.name;
        extension = fileName.split('.').pop().toLowerCase();
    } else if (typeof file === 'string') {
        const decodedUrl = decodeURIComponent(file);
        const parts = decodedUrl.split('/');
        fileName = parts[parts.length - 1].split('?')[0];
        extension = fileName.split('.').pop().toLowerCase();
    }

    return { fileName, extension };
};

export const getThumbnailForFile = (file) => {
    const url = typeof file === 'string' ? file : file?.url || '';
    const { extension } = extractFileInfo(url);
    const ext = extension?.toLowerCase?.();

    const imageExtensions = ['jpg', 'jpeg', 'png', 'svg', 'gif', 'webp', 'bmp', 'tiff', 'tif'];
    if (ext && imageExtensions.includes(ext)) {
        return url;
    }

    const thumbnails = {
        pdf: pdfThumbnail,
        docx: wordThumbnail,
        doc: wordThumbnail,
        word: wordThumbnail,
        mp4: mp4Thumbnail,
        mov: movThumbnail,
        gif: gifThumbnail,
        psd: psdThumbnail,
        eps: epsThumbnail,
        jpg: jpgThumbnail,
        jpeg: jpgThumbnail,
        png: pngThumbnail,
        webp: webpThumbnail,
    };

    return ext ? thumbnails[ext] || defaultThumbnail : defaultThumbnail;
};
