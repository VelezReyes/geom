import React, { useState, useEffect } from 'react';
import './Table.css';

// Function to filter data for the "general" table
export function filterDataGeneral(filters, data, sortConfig) {
  const filteredData = data.filter(row =>
    row.Measure === filters.measure &&
    row.Approach === filters.approach &&
    (filters.year === 'Latest' ? row.Latest === '1' : true) &&
    filters.region.includes(row.Region)
  );

  const sorted = [...filteredData].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  return sorted;
}

// Function to filter data for the "country" table
export function filterDataCountry(filters, data) {
  const country = filters.country;
  const year = filters.year.toString();

  const filteredData = data.filter(
    (row) => row.c === country && row.y === year
  )[0];

  return filteredData;
}

// Function to handle data based on the tableType
export function handleData(filters, data, sortConfig, tableType) {
  if (!data || !filters) {
    console.log('Data or filters are incomplete.');
    return;
  }

  if (tableType === 'general') {
    const sorted = filterDataGeneral(filters, data, sortConfig);
    return sorted;
  } else if (tableType === 'country') {
    const filteredData = filterDataCountry(filters, data);
    if (!filteredData) {
      console.log('No data found for this country and year.');
      return;
    }
    return filteredData;
  }
}

// Function to process data and separate the combined value into "year" and "type"
function processData(data) {
  return data.map(item => {
    let year = 'N/A';
    let type = 'N/A';

    // If 'Variable' exists and contains a space, assume it is in "Year Type" format
    if (item.Variable && typeof item.Variable === 'string' && item.Variable.includes(" ")) {
      [year, type] = item.Variable.split(" ");
    } 
    // If 'Variable' doesn't exist but 'Year' contains a combined value (e.g., "2020 Income")
    else if (item.Year && typeof item.Year === 'string' && item.Year.includes(" ")) {
      [year, type] = item.Year.split(" ");
    } 
    // Otherwise, use the separated values if they exist
    else {
      year = item.Year || 'N/A';
      type = item.Type || 'N/A';
    }
    return { ...item, year, type };
  });
}

function Table({ data, filters, tableType }) {
  const [tableData, setTableData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  useEffect(() => {
    // Process data to separate the combined value into "year" and "type"
    const processedData = processData(data);
    const dataTableProcessed = handleData(filters, processedData, sortConfig, tableType);
    if (dataTableProcessed) {
      setTableData(dataTableProcessed);
    }
  }, [data, filters, sortConfig, tableType]);

  function handleSort(key) {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending'
    });
  }
  
  return (
    <div className="table-container">
      {tableType === 'general' ? (
        <>
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('Name')}>Name</th>
                <th onClick={() => handleSort('year')}>Year</th>
                <th onClick={() => handleSort('type')}>Type</th>
                <th onClick={() => handleSort('Total Inequality')}>Total Inequality</th>
                <th onClick={() => handleSort('IOp Ex-Ante RF')}>IOp Ex-Ante RF</th>
                <th onClick={() => handleSort('IOp Ex-Post')}>IOp Ex-Post</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((item, index) => (
                <tr key={index}>
                  <td>{item.Name}</td>
                  <td>{item.year}</td>
                  <td>{item.type}</td>
                  <td>{Number(item['Total Inequality']).toFixed(2)}</td>
                  <td>{Number(item['IOp Ex-Ante RF']).toFixed(2)}</td>
                  <td>{Number(item['IOp Ex-Post']).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note">Our preferred estimate is the Random Forest</p>
        </>
      ) : (
        <>
          <p>Absolute Inequality of Opportunity</p>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Total Sample Inequality</th>
                <th>Ex-Ante Tree</th>
                <th>Ex-Ante Random Forest</th>
                <th>Ex-Post</th>
              </tr>
            </thead>
            <tbody>
              <tr key="gini">
                <td>Gini</td>
                <td>{Number(tableData["Gini"]).toFixed(2)}</td>
                <td>{Number(tableData["Gini_trees_exante"]).toFixed(2)}</td>
                <td>{Number(tableData["Gini_rforest_exante"]).toFixed(2)}</td>
                <td>{Number(tableData["Gini_trees_expost"]).toFixed(2)}</td>
              </tr>
              <tr key="MLD">
                <td>MLD</td>
                <td>{Number(tableData["MLD"]).toFixed(2)}</td>
                <td>{Number(tableData["MLD_trees_exante"]).toFixed(2)}</td>
                <td>{Number(tableData["MLD_rforest_exante"]).toFixed(2)}</td>
                <td>{Number(tableData["MLD_trees_expost"]).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <p className="note">Our preferred estimate is the Random Forest</p>

          <p>Relative Inequality of Opportunity</p>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Total Sample Inequality</th>
                <th>Ex-Ante Tree</th>
                <th>Ex-Ante Random Forest</th>
                <th>Ex-Post</th>
              </tr>
            </thead>
            <tbody>
              <tr key="gini_rel">
                <td>Gini</td>
                <td>{Number(tableData["Gini"]).toFixed(2)}</td>
                <td>{Number(tableData["Gini_trees_exante_rel"]).toFixed(2)}</td>
                <td>{Number(tableData["Gini_rforest_exante_rel"]).toFixed(2)}</td>
                <td>{Number(tableData["Gini_trees_expost_rel"]).toFixed(2)}</td>
              </tr>
              <tr key="MLD_rel">
                <td>MLD</td>
                <td>{Number(tableData["MLD"]).toFixed(2)}</td>
                <td>{Number(tableData["MLD_trees_exante_rel"]).toFixed(2)}</td>
                <td>{Number(tableData["MLD_rforest_exante_rel"]).toFixed(2)}</td>
                <td>{Number(tableData["MLD_trees_expost_rel"]).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <p className="note">Our preferred estimate is the Random Forest</p>
        </>
      )}
    </div>
  );
}

export default Table;
