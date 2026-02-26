import React, { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTable, faGlobe, faChartLine, faChartPie, faChartSimple, faSquarePollVertical, faFileText } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';
import { VisualizationContext } from '../contexts/Visualization.context';
import './VisualizationSelector.css';


const SelectorContainer = styled.div`
  display: inline-flex;
  justify-content: start;
  padding: 2px;
  margin: 0;
  background-color: #f4f4f4;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px #e7e7e7;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  border: 1px solid #f4f4f4;
  background-color: #fff;
  padding: 5px 10px;
  margin-right: 1px;
  cursor: pointer;
  color: #858585;
  font-weight: 500;
  height: 28px;
  line-height: 28px;
  font-size: 14px;
  border-radius: 5px;
  transition: background-color 0.3s, color 0.3s;

  &:last-child {
    margin-right: 0;
  }

  &:hover {
    background-color: #e2e2e2;
  }

  &.active {
    background-color: #dbe5f0;
    color: #1d3d63;
  }
`;

const ButtonLabel = styled.span`
  margin-left: 6px;
`;

function VisualizationSelector({ type }) {
  const { visualization, setVisualization } = useContext(VisualizationContext);
  console.log('Visualization:#####################################################################################', type);
  const buttons = {
    world: [
      { key: 'map', icon: faGlobe, label: 'Map' },
      { key: 'table', icon: faTable, label: 'Table' },
      { key: 'chart', icon: faChartLine, label: 'Chart' }
    ],
    country: [
      { key: 'ante', icon: faChartPie, label: 'Ex-Ante' },
      { key: 'post', icon: faChartPie, label: 'Ex-Post' },
      { key: 'alluvial', icon: faSquarePollVertical, label: 'Alluvial' },
      { key: 'descriptive', icon: faFileText, label: 'Descriptive' },
      { key: 'countryTable', icon: faTable, label: 'Table' }
    ]
  };
  return (
    <div id='visualization-selector'>
      {
        buttons[type].map(button => (
          <button
            key={button.key}
            className={visualization === button.key ? 'active' : ''}
            onClick={() => setVisualization(button.key)}
            id='visualization-option'
          >
            <FontAwesomeIcon icon={button.icon} />
            <ButtonLabel>{button.label}</ButtonLabel>
          </button>
        ))
      }
    </div>
  );
}

export default VisualizationSelector;
