import React, { useState } from 'react';
import styles from './css/CustomSection.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faShoppingCart, faCaretDown } from '@fortawesome/free-solid-svg-icons';

import epsThumbnail from '../assets/images/thumbnails/eps-icon.png';
import gifThumbnail from '../assets/images/thumbnails/gif-icon.png';
import jpgThumbnail from '../assets/images/thumbnails/jpg-icon.png';
import movThumbnail from '../assets/images/thumbnails/mov-icon.png';
import pdfThumbnail from '../assets/images/thumbnails/pdf-icon.png';
import pngThumbnail from '../assets/images/thumbnails/png-icon.png';
import mp4Thumbnail from '../assets/images/thumbnails/mp4-icon.png';
import webpThumbnail from '../assets/images/thumbnails/webp-icon.png';
import psdThumbnail from '../assets/images/thumbnails/psd-icon.png';
import wordThumbnail from '../assets/images/thumbnails/word-icon.png';
import defaultThumbnail from '../assets/images/thumbnails/file-icon.png';

const CustomSection = ({
  title,
  logo,
  files = [],
  onFilePreview,
  onFileDownload,
  onFileAddToCart,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSection = () => setIsOpen(prev => !prev);

  const extractFileInfo = (fileUrl) => {
    const decodedUrl = decodeURIComponent(fileUrl);
    const parts = decodedUrl.split('/');
    const fullName = parts[parts.length - 1].split('?')[0];
    const dotIndex = fullName.lastIndexOf('.');
    const extension = dotIndex !== -1 ? fullName.substring(dotIndex + 1) : '';
    return { fileName: fullName, extension };
  };

  const getThumbnailForFile = (fileUrl) => {
    const { extension } = extractFileInfo(fileUrl);
    const ext = extension.toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') return jpgThumbnail;
    if (ext === 'png') return pngThumbnail;
    if (ext === 'gif') return gifThumbnail;
    if (ext === 'webp') return webpThumbnail;
    if (ext === 'mov') return movThumbnail;
    if (ext === 'pdf') return pdfThumbnail;
    if (ext === 'mp4') return mp4Thumbnail;
    if (ext === 'psd') return psdThumbnail;
    if (ext === 'eps') return epsThumbnail;
    if (ext === 'doc' || ext === 'docx') return wordThumbnail;
    return defaultThumbnail;
  };

  return (
    <div className={styles.imagesSection}>
      <div
        className={`${styles.headerTab} ${isOpen ? styles.open : styles.closed}`}
        onClick={toggleSection}
      >
        <div className={styles.headerLeft}>
          <div className={styles.iconCircle}>
            <img
              src={logo || defaultThumbnail}
              alt={`${title} logo`}
              className={styles.headerIcon}
            />
          </div>
          <h3>{title}</h3>
        </div>
        <span className={styles.toggleIconContainer}>
          <FontAwesomeIcon icon={faCaretDown} className={styles.toggleIcon} />
        </span>
      </div>
      {isOpen && (
        <div className={styles.fileList}>
          {files.map((fileUrl, index) => {
            const { fileName, extension } = extractFileInfo(fileUrl);
            return (
              <div key={index} className={styles.fileItem}>
                <div className={styles.thumbnailContainer}>
                  <img
                    src={getThumbnailForFile(fileUrl)}
                    alt={`Thumbnail ${fileName}`}
                    className={styles.thumbnail}
                    onError={(e) => { e.target.src = '/assets/placeholder-image.png'; }}
                  />
                </div>
                <div className={styles.fileInfo}>
                  <span className={styles.fileName}>{fileName}</span>
                  <span className={styles.fileFormat}>
                    Format: {extension.toLowerCase() || 'unknown'}
                  </span>
                </div>
                <div className={styles.fileButtonsContainer}>
                  {onFilePreview && (
                    <button
                      onClick={() => onFilePreview(fileUrl)}
                      className={styles.previewBtn}
                    >
                      Click to Preview
                    </button>
                  )}
                  {onFileDownload && (
                    <button
                      onClick={() => onFileDownload(fileUrl, fileName)}
                      className={styles.iconBtn}
                    >
                      <span className={styles.innerCircle}>
                        <FontAwesomeIcon icon={faDownload} />
                      </span>
                    </button>
                  )}
                  {onFileAddToCart && (
                    <button
                      onClick={() => onFileAddToCart({ url: fileUrl, fileName })}
                      className={styles.iconBtn}
                    >
                      <FontAwesomeIcon icon={faShoppingCart} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSection;
