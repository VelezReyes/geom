import React, { createContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const worldDefaultFilters = {
  measure: 'Gini',
  perspective: 'Ex-Ante Random Forest',
  approach: 'Absolute',
  variable: 'Income',
  region: 'Africa',
  countries: ['PER'],
};

const countryDefaultFilters = {
  country: 'ARG',
  year: '2014',
  anteFormat: 'chart',
  postFormat: 'chart',
};

const initializeFilters = () => ({ ...worldDefaultFilters, ...countryDefaultFilters,});

// available filters for each visualization type
const visualizationFilters = {
  world: {
    map: ['measure', 'perspective', 'approach', 'variable'],
    table: ['measure', 'approach', 'year', 'region'],
    chart: ['measure', 'perspective', 'approach', 'variable', 'countries'],
  },
  country: {
    ante: ['anteFormat', 'country', 'year'],
    post: ['postFormat', 'country', 'year'],
    pdp: ['country', 'year'],
    alluvial: ['country', 'year'],
    descriptive: ['country', 'year'],
    countryTable: ['country', 'year'],
  },
};

export const VisualizationContext = createContext();

export const VisualizationProvider = ({ children }) => {
  const [visualization, setVisualization] = useState('');
  const [filters, setFilters] = useState(initializeFilters());
  const [showBubble, setShowBubble] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const visualizationParam = queryParams.get('visualization');
    const route = location.pathname.includes('/world') ? 'world' : 'country';

    // console.log('visualizationParam', visualizationParam);
    // console.log('queryParams', queryParams);

    const validFilters = visualizationFilters[route][visualizationParam] || [];

    const filterParams = validFilters.reduce((acc, filterKey) => {
      const paramValue = queryParams.get(filterKey);
      if (paramValue) {
        acc[filterKey] = paramValue;
      }
      return acc;
    }, {});

    if (visualizationParam) {
      setVisualization(visualizationParam);
    }

    setFilters((prevFilters) => ({
      ...prevFilters,
      ...filterParams,
    }));
  }, [location.search]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const route = location.pathname.includes('/world') ? 'world' : 'country';
    const validFilters = visualizationFilters[route][visualization] || [];

    queryParams.set('visualization', visualization);
    validFilters.forEach((filterKey) => {
      if (filters[filterKey]) {
        queryParams.set(filterKey, filters[filterKey]);
      }
    });

    navigate(`${location.pathname}?${queryParams.toString()}`, { replace: true });
  }, [visualization, filters, navigate, location.pathname]);

  const handleFilterChange = (filterName, value) => {
    console.log('handleFilterChange', filterName, value);
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: value,
    }));
  };

  return (
    <VisualizationContext.Provider
      value={{ visualization, setVisualization, filters, setFilters, handleFilterChange, showBubble, setShowBubble }}
    >
      {children}
    </VisualizationContext.Provider>
  );
};
