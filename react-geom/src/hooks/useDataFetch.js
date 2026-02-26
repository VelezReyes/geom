import { useState, useEffect } from 'react';
// External libraries
import * as d3 from 'd3';

const useDataFetch = () => {
  const [worldData, setWorldData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [countryTableData, setCountryTableData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [worldData, tableData, countryTableData] = await Promise.all([
          d3.csv('/data/processed/final.csv'),
          d3.csv('/data/processed/final_table.csv'),
          d3.csv('/data/processed/results.csv'),
        ]);
        setWorldData(worldData);
        setTableData(tableData);
        setCountryTableData(countryTableData);
      } catch (error) {
        console.error('Error loading CSV data:', error);
      }
    };

    fetchData();
  }, []);

  return { worldData, tableData, countryTableData };
};

export default useDataFetch;
