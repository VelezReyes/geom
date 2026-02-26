import React, { useState, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShareAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import './Footer.css';
import DownloadButton from './DownloadButton';

function Footer({ instructions }) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const handleShareClick = () => {
    const currentUrl = window.location.href;

    setShareUrl(currentUrl);

    if (navigator.share) {
      navigator.share({
        title: 'Check out this visualization',
        url: currentUrl,
      })
        .catch((error) => console.error('Error sharing', error));
    } else {
      setShowShareDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setShowShareDialog(false);
  };

  return (
    <footer className="Footer">
      <p>GEOM v0.2.0</p>
      <div className="footer-controls">
        <DownloadButton />
        <button onClick={handleShareClick} aria-label="Share">
          <FontAwesomeIcon icon={faShareAlt} />
        </button>
      </div>

      {showShareDialog && (
        <div className="share-dialog">
          <div className="share-dialog-content">
            <button className="close-button" aria-label="Close"
              onClick={handleCloseDialog}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <h3>Share this GEOM visualization</h3>
            <p>Copy the link below to share:</p>
            <input type="text" value={shareUrl} readOnly />
            <button className="copy-button"
              onClick={() => navigator.clipboard.writeText(shareUrl)}>
              Copy Link
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}

export default Footer;
