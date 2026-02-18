import React from 'react';

function Tooltip({ content, position, style }) {
  if (!content) return null;

  const defaultStyle = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    transition: 'opacity 0.3s',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    color: 'black',
    padding: '5px',
    fontSize: '12px',
    borderRadius: '5px',
    pointerEvents: 'none',
    opacity: 1,
  };

  const combinedStyle = { ...defaultStyle, ...style };

  return (
    <div style={combinedStyle}>
      {content}
    </div>
  );
}

export default Tooltip;
