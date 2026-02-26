import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import Tooltip from '../Tooltip';
import './Filter.css';

function Filter({ label, options, value, onChange }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipText, setTooltipText] = useState('');

  useEffect(() => {
    fetch('/tooltips.json')
      .then((response) => response.json())
      .then((data) => {
        setTooltipText(data[label.toLowerCase()]);
      })
      .catch((error) => console.error('Failed to load tooltips', error));
  }, [label]);

  const handleMouseEnter = (event) => {
    const rect = event.target.getBoundingClientRect();
    setTooltipPosition({
      x: rect.x - rect.left + rect.width,
      y: rect.height * 2,
    });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const selectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: '36px',
      borderRadius: '4px',
      borderColor: '#ddd',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#aaa',
      },
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#e0e0e0',
      color: '#333',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      fontWeight: '500',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#333',
      '&:hover': {
        backgroundColor: '#ccc',
        color: '#000',
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#f0f0f0' : '#fff',
      color: '#333',
      '&:hover': {
        backgroundColor: '#e0e0e0',
      },
    }),
  };

  const renderTooltip = () => {
    return (
      showTooltip &&
      tooltipText && (
        <Tooltip
          content={<div dangerouslySetInnerHTML={{ __html: tooltipText }} />}
          position={tooltipPosition}
          style={{
            minWidth: '240px',
            maxWidth: '500px',
            width: 'auto',
            whiteSpace: 'normal',
            zIndex: 100,
          }}
        />
      )
    );
  };

  return (
    <div className="filter">
      <label className="filter-label">
        {label}
        {tooltipText && (
          <FontAwesomeIcon
            icon={faInfoCircle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="info-icon"
          />
        )}
      </label>
      {renderTooltip()}
      {label === 'Countries' ? (
        <Select
          isMulti
          styles={selectStyles}
          options={options.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          value={options.filter((option) =>
            value.includes(option.value)
          )}
          onChange={(selected) =>
            onChange(selected.map((s) => s.value))
          }
          placeholder="Select countries..."
          className="custom-select"
        />
      ) : (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="filter-select"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export default Filter;
