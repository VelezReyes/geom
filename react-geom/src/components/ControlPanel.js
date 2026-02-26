import React from 'react';
import VisualizationSelector from './VisualizationSelector';
import styled from 'styled-components';

const ControlsRow = styled.nav`
  display: flex;
  padding: 0 16px;
  background-color: #fffcfc;
  justify-content: space-between;
`;

const VisualizationFilters = styled.div`
  display: flex;
  justify-content: start;
  align-items: center;
  padding: 10px 16px;
  background-color: #fffcfc;
`;

function ControlPanel({ route, renderFilters }) {
  const type = route === 'world' ? 'world' : 'country';

  const rows = [
    <ControlsRow key="controls">
      <VisualizationSelector type={type} />
    </ControlsRow>,
    <VisualizationFilters key="filters">
      {renderFilters(type)}
    </VisualizationFilters>
  ];

  return (
    <>
      {route === "world" ? rows : rows.reverse()}
    </>
  );
}

export default ControlPanel;
