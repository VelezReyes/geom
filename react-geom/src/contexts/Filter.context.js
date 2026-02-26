import React, { createContext, useState } from 'react';
import { initializeFilters, initializeFilterOptions } from '../utils/initializeFilters';

export const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState(initializeFilters());
  const [filterOptions, setFilterOptions] = useState(initializeFilterOptions());

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilters,
        filterOptions,
        setFilterOptions
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};
