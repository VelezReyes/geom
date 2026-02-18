import React, { useState, useEffect, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle, faCog, faExpand } from '@fortawesome/free-solid-svg-icons';
import { VisualizationContext } from '../contexts/Visualization.context';
import './Header.css';

function Header() {
  const title = 'Global Estimates of Opportunity and Mobility';
  const { visualization } = useContext(VisualizationContext);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [instructions, setInstructions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleShowSidebar = () => setShowSidebar(true);
  const handleCloseSidebar = () => setShowSidebar(false);

  const handleShowSettings = () => setShowSettingsPanel(true);
  const handleCloseSettings = () => setShowSettingsPanel(false);

  useEffect(() => {
    const fetchInstructions = async () => {
      try {
        const response = await fetch('/instructions.json');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setInstructions(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load instructions:', err);
        setError('Failed to load instructions.');
        setLoading(false);
      }
    };

    fetchInstructions();
  }, []);

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  return (
    <header className="Header">
      <h1>{title}</h1>
      <div className="control-panel">
        <button onClick={handleFullscreen} aria-label="Toggle Fullscreen">
          <FontAwesomeIcon icon={faExpand} />
        </button>
        <button onClick={handleShowSidebar} aria-label="Show Explanation">
          <FontAwesomeIcon icon={faQuestionCircle} />
        </button>
        <button onClick={handleShowSettings} aria-label="Settings"  >
          <FontAwesomeIcon icon={faCog} />
        </button>
      </div>
      {showSidebar && (
        <div className={`sidebar ${showSidebar ? 'open' : ''}`}>
          <button onClick={handleCloseSidebar} className="close-button" aria-label="Close Sidebar">
            &times;
          </button>
          <div className="sidebar-content">
            {loading && <p>Loading instructions...</p>}
            {error && <p>{error}</p>}
            {!loading && !error && (
              <>
              <h3>How to read the data</h3>
              <div dangerouslySetInnerHTML={{ __html: instructions[visualization] || 'No content available' }} />
              </>
            )}
          </div>
        </div>
      )}
      {showSettingsPanel && (
        <div className={`settings-panel ${showSettingsPanel ? 'open' : ''}`}>
          <button onClick={handleCloseSettings} className="close-button" aria-label="Close Settings">
            &times;
          </button>
          <div className="settings-content">
            <h3>Settings</h3>
            <label>
              <input type="checkbox" checked="false" />
              Enable Footer Description
            </label>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
