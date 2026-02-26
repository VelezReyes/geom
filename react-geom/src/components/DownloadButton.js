import { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { handleData } from './Table';
import { VisualizationContext } from '../contexts/Visualization.context';
import { FilterContext } from '../contexts/Filter.context';
import { faDownload } from '@fortawesome/free-solid-svg-icons'; 
import usePdfUrls from '../hooks/usePdfUrls';
import useDataFetch from '../hooks/useDataFetch';
import html2canvas from 'html2canvas';

export const handleDownloadPng = async (filters, visualization) => {
    try {
        const wrapper = document.getElementById('main-wrapper-components');
        const canvas = await html2canvas(wrapper);
        const link = document.createElement("a");
        const ulrFile = canvas.toDataURL("image/png");
        link.href = ulrFile;
        link.download = `${filters.country}_${filters.year}_${visualization}.png`;
        link.click();
        link.remove();
    } catch (e) {
        throw new Error("Error generating file: ", e);
    }
}

export const joinContentCsv = (header, rows) => {
    const csvContent = [
        header.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
}

export const convertToCsvWorld = (data) => {
    const header = ['Name', 'Year', 'Total Inequality', 'IOp Ex-Ante RF', 'IOp Ex-Post'];
    const rows = data.map(item => [
        item.Name,
        item.Year,
        item['Total Inequality'],
        item['IOp Ex-Ante RF'],
        item['IOp Ex-Post']
    ]);
    const csvContent = joinContentCsv(header, rows);

    return csvContent;
}
//Structure of table in country is distintic to world
export const convertToCsvCountry = (tableData) => {
    let rows = [];
    rows.push(['Gini', Number(tableData["Gini"]).toFixed(2), Number(tableData["Gini_trees_exante"]).toFixed(2), Number(tableData["Gini_rforest_exante"]).toFixed(2), Number(tableData["Gini_trees_expost"]).toFixed(2)]);
    rows.push(['MLD', tableData["MLD"], Number(tableData["MLD_trees_exante"]).toFixed(2), Number(tableData["MLD_rforest_exante"]).toFixed(2), Number(tableData["MLD_trees_expost"]).toFixed(2)]);
    rows.push(['Gini', Number(tableData["Gini"]).toFixed(2), Number(tableData["Gini_trees_exante_rel"]).toFixed(2), Number(tableData["Gini_rforest_exante_rel"]).toFixed(2), Number(tableData["Gini_trees_expost_rel"]).toFixed(2)]);
    rows.push(['MLD', tableData["MLD"], Number(tableData["MLD_trees_exante_rel"]).toFixed(2), Number(tableData["MLD_rforest_exante_rel"]).toFixed(2), Number(tableData["MLD_trees_expost_rel"]).toFixed(2)]);
    const header = ['', 'Total Sample Inequality', 'Ex-Ante Tree', 'IOp Ex-Ante RF', 'Ex-Ante RF'];
    const csvContent = joinContentCsv(header, rows);

    return csvContent;
}

export const handleDownloadCsv = (sortedData, tableType, filters) => {
    let csvContent = [];
    
    if (tableType === 'country') {
        csvContent = convertToCsvCountry(sortedData);
    } else {
        csvContent = convertToCsvWorld(sortedData);
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    if (tableType === 'country') {
        link.download = `${filters.country}_${filters.year}_table_data.csv`;
    } else {
        link.download = `${filters.region}_${filters.year}_table_data.csv`;
    }
    
    link.click();
    link.remove();
}

export const handleDownloadPdf = (pdf, filters, visualization) => {
    const link = document.createElement('a');
    link.href = pdf[visualization];
    link.target = '_blank';
    link.download = `Descriptives_${filters.country}_${filters.year}.pdf`;
    link.click();
    link.remove();
}

export const handleDownload = async (tableData, countryTableData, visualization, filters, pdfs) => {
    const visualizationsPng = ['map', 'chart', 'ante', 'post', 'pdp', 'alluvial'];
    const visualizationsPdf = ['descriptive'];
    const visualizationsCsv = ['table', 'countryTable'];

    if (visualizationsPng.includes(visualization)) {
        handleDownloadPng(filters, visualization);
    } else if (visualizationsCsv.includes(visualization)) {
        const sortConfig = { key: null, direction: 'ascending' };
        let tableType = 'general';
        let data = tableData;

        if (visualization === 'countryTable') {
            tableType = 'country';
            data = countryTableData;
        }
        
        let sortedData = handleData(filters,data, sortConfig, tableType);
        handleDownloadCsv(sortedData, tableType, filters);
    } else if (visualizationsPdf.includes(visualization)) {
        handleDownloadPdf(pdfs, filters, visualization);
    }
}

export function DownloadButton() {
    const { tableData, countryTableData } = useDataFetch();
    const { visualization } = useContext(VisualizationContext);
    const { filters } = useContext(FilterContext);
    const pdfs = usePdfUrls(filters, countryTableData);

    const handleClick = () => {
        handleDownload(tableData, countryTableData, visualization, filters, pdfs);
    }

    return (
        <button onClick={handleClick} aria-label="Download Data">
            <FontAwesomeIcon icon={faDownload} />
        </button>
    );
}

export default DownloadButton;