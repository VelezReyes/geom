import { render, screen } from '@testing-library/react';
import * as DownloadButtonComponet from './DownloadButton'
import { VisualizationProvider } from '../contexts/Visualization.context';
import { MemoryRouter } from 'react-router-dom';
import { FilterProvider } from '../contexts/Filter.context';
import html2canvas from 'html2canvas';


//mock data
const tableData = [
    { '': '1', 'Approach': 'Absolute', 'IOp Ex-Ante RF': '0.1786', 'IOp Ex-Ante Tree': '0.167', 'IOp Ex-Post': '0.1773', 'Latest': '1', 'Measure': 'Gini', 'Name': 'Argentina', 'Region': 'LATAM', 'Total Inequality': '0.3884', 'Year': '2014 (Income)', 'c': 'ARG', 'y': '2014' },
    { '': '2', 'Approach': 'Relative', 'IOp Ex-Ante RF': '45.9835221421215', 'IOp Ex-Ante Tree': '42.9969104016478', 'IOp Ex-Post': '45.648815653965', 'Latest': '1', 'Measure': 'Gini', 'Name': 'Argentina', 'Region': 'LATAM', 'Total Inequality': '0.3884', 'Year': '2014 (Income)', 'c': 'ARG', 'y': '2014' },
    { '': '3', 'Approach': 'Absolute', 'IOp Ex-Ante RF': '0.0499', 'IOp Ex-Ante Tree': '0.0438', 'IOp Ex-Post': '0.0506', 'Latest': '1', 'Measure': 'MLD', 'Name': 'Argentina', 'Region': 'LATAM', 'Total Inequality': '0.2759', 'Year': '2014 (Income)', 'c': 'ARG', 'y': '2014' },
    { '': '4', 'Approach': 'Relative', 'IOp Ex-Ante RF': '18.0862631388184', 'IOp Ex-Ante Tree': '15.8753171438927', 'IOp Ex-Post': '18.3399782529902', 'Latest': '1', 'Measure': 'MLD', 'Name': 'Argentina', 'Region': 'LATAM', 'Total Inequality': '0.2759', 'Year': '2014 (Income)', 'c': 'ARG', 'y': '2014' },
    { '': '5', 'Approach': 'Absolute', 'IOp Ex-Ante RF': '0.2121', 'IOp Ex-Ante Tree': '0.1783', 'IOp Ex-Post': '0.2343', 'Latest': '1', 'Measure': 'Gini', 'Name': 'Armenia', 'Region': 'Asia + Oceania', 'Total Inequality': '0.4695', 'Year': '2016 (Income)', 'c': 'ARM', 'y': '2016' }
];
const countryTableData = [
    { '': '1', 'Circumstances': 'all', 'Gini': '0.3884', 'Gini_rforest_exante': '0.1786', 'Gini_rforest_exante_rel': '45.9835221421215', 'Gini_trees_exante': '0.167', 'Gini_trees_exante_rel': '42.9969104016478', 'Gini_trees_expost': '0.1773', 'Gini_trees_expost_rel': '45.648815653965', 'MLD': '0.2759', 'MLD_rforest_exante': '0.0499', 'MLD_rforest_exante_rel': '18.0862631388184', 'MLD_trees_exante': '0.0438', 'MLD_trees_exante_rel': '15.8753171438927', 'MLD_trees_expost': '0.0506', 'MLD_trees_expost_rel': '18.3399782529902', 'Region': 'LATAM', 'Sample': '6632', 'abs_gini_deb': '0.162', 'c': 'ARG', 'iso': 'ARG', 'latest': '1', 'name': 'Argentina', 'rel_gini_deb': '41.72', 'sd_abs_gini_deb': '0.0084', 'sd_rel_gini_deb': '1.76', 'var': 'Income', 'y': '2014' },
    { '': '2', 'Circumstances': 'all', 'Gini': '0.4695', 'Gini_rforest_exante': '0.2121', 'Gini_rforest_exante_rel': '45.1757188498403', 'Gini_trees_exante': '0.1783', 'Gini_trees_exante_rel': '37.9765708200213', 'Gini_trees_expost': '0.2343', 'Gini_trees_expost_rel': '49.9041533546326', 'MLD': '0.4059', 'MLD_rforest_exante': '0.0813', 'MLD_rforest_exante_rel': '20.029563932003', 'MLD_trees_exante': '0.0593', 'MLD_trees_exante_rel': '14.6095097314609', 'MLD_trees_expost': '0.3464', 'MLD_trees_expost_rel': '85.3412170485341', 'Region': 'Asia + Oceania', 'Sample': '1221', 'abs_gini_deb': '0.1735', 'c': 'ARM', 'iso': 'ARM', 'latest': '1', 'name': 'Armenia', 'rel_gini_deb': '36.91', 'sd_abs_gini_deb': '0.1338', 'sd_rel_gini_deb': '21.92', 'var': 'Income', 'y': '2016' },
    { '': '3', 'Circumstances': 'all', 'Gini': '0.3367', 'Gini_rforest_exante': '0.0894', 'Gini_rforest_exante_rel': '26.5518265518266', 'Gini_trees_exante': '0.0773', 'Gini_trees_exante_rel': '22.958122958123', 'Gini_trees_expost': '0.0547', 'Gini_trees_expost_rel': '16.2459162459162', 'MLD': '0.1941', 'MLD_rforest_exante': '0.0125', 'MLD_rforest_exante_rel': '6.43997939206595', 'MLD_trees_exante': '0.0098', 'MLD_trees_exante_rel': '5.0489438433797', 'MLD_trees_expost': '0.0057', 'MLD_trees_expost_rel': '2.93663060278207', 'Region': 'Asia + Oceania', 'Sample': '5684', 'abs_gini_deb': '0.0698', 'c': 'AUS', 'iso': 'AUS', 'latest': '0', 'name': 'Australia', 'rel_gini_deb': '20.71', 'sd_abs_gini_deb': '0.0087', 'sd_rel_gini_deb': '2.3', 'var': 'Income', 'y': '2005' },
    { '': '4', 'Circumstances': 'all', 'Gini': '0.3439', 'Gini_rforest_exante': '0.0951', 'Gini_rforest_exante_rel': '27.6533876126781', 'Gini_trees_exante': '0.0787', 'Gini_trees_exante_rel': '22.8845594649607', 'Gini_trees_expost': '0.0643', 'Gini_trees_expost_rel': '18.6972957255016', 'MLD': '0.2042', 'MLD_rforest_exante': '0.0141', 'MLD_rforest_exante_rel': '6.90499510284035', 'MLD_trees_exante': '0.0101', 'MLD_trees_exante_rel': '4.94613124387855', 'MLD_trees_expost': '0.0099', 'MLD_trees_expost_rel': '4.84818805093046', 'Region': 'Asia + Oceania', 'Sample': '5778', 'abs_gini_deb': '0.0802', 'c': 'AUS', 'iso': 'AUS', 'latest': '0', 'name': 'Australia', 'rel_gini_deb': '23.33', 'sd_abs_gini_deb': '0.0106', 'sd_rel_gini_deb': '2.67', 'var': 'Income', 'y': '2007' },
    { '': '5', 'Circumstances': 'all', 'Gini': '0.3255', 'Gini_rforest_exante': '0.0807', 'Gini_rforest_exante_rel': '24.7926267281106', 'Gini_trees_exante': '0.0563', 'Gini_trees_exante_rel': '17.2964669738863', 'Gini_trees_expost': '0.0844', 'Gini_trees_expost_rel': '25.9293394777266', 'MLD': '0.1874', 'MLD_rforest_exante': '0.0102', 'MLD_rforest_exante_rel': '5.44290288153682', 'MLD_trees_exante': '0.0055', 'MLD_trees_exante_rel': '2.93489861259338', 'MLD_trees_expost': '0.0281', 'MLD_trees_expost_rel': '14.9946638207044', 'Region': 'Asia + Oceania', 'Sample': '6137', 'abs_gini_deb': '0.0599', 'c': 'AUS', 'iso': 'AUS', 'latest': '0', 'name': 'Australia', 'rel_gini_deb': '18.41', 'sd_abs_gini_deb': '0.0098', 'sd_rel_gini_deb': '2.73', 'var': 'Income', 'y': '2009' },
    { '': '6', 'Circumstances': 'all', 'Gini': '0.3311', 'Gini_rforest_exante': '0.0873', 'Gini_rforest_exante_rel': '26.3666565992147', 'Gini_trees_exante': '0.0733', 'Gini_trees_exante_rel': '22.1383267894896', 'Gini_trees_expost': '0.0651', 'Gini_trees_expost_rel': '19.661733615222', 'MLD': '0.1902', 'MLD_rforest_exante': '0.0118', 'MLD_rforest_exante_rel': '6.20399579390116', 'MLD_trees_exante': '0.0087', 'MLD_trees_exante_rel': '4.57413249211356', 'MLD_trees_expost': '0.0073', 'MLD_trees_expost_rel': '3.83806519453207', 'Region': 'Asia + Oceania', 'Sample': '8184', 'abs_gini_deb': '0.0699', 'c': 'AUS', 'iso': 'AUS', 'latest': '0', 'name': 'Australia', 'rel_gini_deb': '21.1', 'sd_abs_gini_deb': '0.0059', 'sd_rel_gini_deb': '1.63', 'var': 'Income', 'y': '2011' }
];
const filters = [
    { 'anteFormat': 'chart', 'approach': 'Absolute', 'countries': ['PER'], 'country': 'ARG', 'measure': 'Gini', 'perspective': 'Ex-Ante Random Forest', 'postFormat': 'chart', 'region': 'Africa', 'variable': 'Income', 'year': 2014 }
];
const header = ['', 'Total Sample Inequality', 'Ex-Ante Tree', 'IOp Ex-Ante RF', 'Ex-Ante RF'];
const testJoinContentCsv = [
    ['Gini', '0.39', '0.17', '0.18', '0.18'],
    ['MLD', '0.2759', '0.04', '0.05', '0.05'],
    ['Gini', '0.39', '43.00', '45.98', '45.65'],
    ['MLD', '0.2759', '15.88', '18.09', '18.34']
];
const sortedData = { "": "13", "Circumstances": "all", "Gini": "0.2804", "Gini_rforest_exante": "0.0988", "Gini_rforest_exante_rel": "35.2353780313837", "Gini_trees_exante": "0.0957", "Gini_trees_exante_rel": "34.1298145506419", "Gini_trees_expost": "0.0908", "Gini_trees_expost_rel": "32.3823109843081", "MLD": "0.1555", "MLD_rforest_exante": "0.016", "MLD_rforest_exante_rel": "10.2893890675241", "MLD_trees_exante": "0.0167", "MLD_trees_exante_rel": "10.7395498392283", "MLD_trees_expost": "0.0157", "MLD_trees_expost_rel": "10.096463022508", "Region": "Europe", "Sample": "5726", "abs_gini_deb": "0.066", "c": "AT", "iso": "AUT", "latest": "1", "name": "Austria", "rel_gini_deb": "23.54", "sd_abs_gini_deb": "0.0056", "sd_rel_gini_deb": "2.05", "var": "Income", "y": "2019" };
const mockLink = {
    href: '',
    download: '',
    target: '',
    click: jest.fn(),
    remove: jest.fn(),
    setAttribute: jest.fn(),

};
const pdf = { descriptive: 'http://localhost:3001/api/files/pdf?category=descriptive&country=ARG&year=2014' };
// expected data
const exprectedConvertToCsvCountry = `,Total Sample Inequality,Ex-Ante Tree,IOp Ex-Ante RF,Ex-Ante RF\nGini,0.39,0.17,0.18,0.18\nMLD,0.2759,0.04,0.05,0.05\nGini,0.39,43.00,45.98,45.65\nMLD,0.2759,15.88,18.09,18.34`;
const exprectedConvertToCsvWorld = `Name,Year,Total Inequality,IOp Ex-Ante RF,IOp Ex-Post\nArgentina,2014 (Income),0.3884,0.1786,0.1773\nArgentina,2014 (Income),0.3884,45.9835221421215,45.648815653965\nArgentina,2014 (Income),0.2759,0.0499,0.0506\nArgentina,2014 (Income),0.2759,18.0862631388184,18.3399782529902\nArmenia,2016 (Income),0.4695,0.2121,0.2343`;

//mocks dependences 
jest.mock('../hooks/useDataFetch', () => {
    return () => {
        return {
            tableData,
            countryTableData
        }
    };
});
jest.mock('html2canvas', () => jest.fn());

describe('DownloadButton functions', () => {
    test('convertToCsvCountry should be return text format csv', () => {
        const functionReturn = DownloadButtonComponet.convertToCsvCountry(countryTableData[0]);
        expect(functionReturn).toBe(exprectedConvertToCsvCountry);
    });

    test('joinContentCsv shuld be return format csv', () => {
        const functionReturn = DownloadButtonComponet.joinContentCsv(header, testJoinContentCsv);
        expect(functionReturn).toBe(exprectedConvertToCsvCountry);
    });

    test('convertToCsvWorld shuld be return format csv', () => {
        const functionReturn = DownloadButtonComponet.convertToCsvWorld(tableData);
        expect(functionReturn).toBe(exprectedConvertToCsvWorld);
    });

    test('DownloadButton shuld be render the button of download', () => {
        const visualization = 'ante';
        render(
            <MemoryRouter>
                <VisualizationProvider value={{ visualization }}>
                    <FilterProvider value={{ filters }}>
                        <DownloadButtonComponet.DownloadButton />
                    </FilterProvider>
                </VisualizationProvider>
            </MemoryRouter>
        );

        const button = screen.getByRole('button', { name: 'Download Data' });
        expect(button).toBeInTheDocument();
    });

    test('handleDownloadPng should be generate and download file png', async () => {
        jest.spyOn(document, 'getElementById').mockImplementation(() => ({}));
        jest.spyOn(document, 'createElement').mockImplementation(() => mockLink);

        html2canvas.mockResolvedValue({
            toDataURL: () => 'data:image/png;base64,testbase64data',
        });

        const visualization = 'chart';

        await DownloadButtonComponet.handleDownloadPng(filters[0], visualization);

        expect(document.getElementById).toHaveBeenCalledWith('main-wrapper-components');
        expect(html2canvas).toHaveBeenCalled();
        expect(mockLink.href).toBe('data:image/png;base64,testbase64data');
        expect(mockLink.download).toBe('ARG_2014_chart.png');
        expect(mockLink.click).toHaveBeenCalled();
        expect(mockLink.remove).toHaveBeenCalled();
    });

    test('handleDownloadCsv shoud be generate and download file csv when tableType is country', () => {
        jest.spyOn(require('./DownloadButton'), 'convertToCsvCountry').mockImplementation(() => exprectedConvertToCsvCountry);
        global.URL.createObjectURL = jest.fn();
        jest.spyOn(global.URL, 'createObjectURL').mockImplementation(() => 'blob:http://geom-example.com/blob-url');
        jest.spyOn(document, 'createElement').mockImplementation(() => mockLink);

        DownloadButtonComponet.handleDownloadCsv(sortedData, 'country', filters[0]);

        expect(mockLink.click).toHaveBeenCalled();
        expect(mockLink.remove).toHaveBeenCalled();
    });

    test('handleDownloadCsv shoud be generate and download file csv when tableType is not country', () => {
        jest.spyOn(require('./DownloadButton'), 'convertToCsvWorld').mockImplementation(() => exprectedConvertToCsvWorld);
        global.URL.createObjectURL = jest.fn();
        jest.spyOn(global.URL, 'createObjectURL').mockImplementation(() => 'blob:http://geom-example.com/blob-url');
        jest.spyOn(document, 'createElement').mockImplementation(() => mockLink);

        DownloadButtonComponet.handleDownloadCsv(tableData, 'world', filters[0]);

        expect(mockLink.click).toHaveBeenCalled();
        expect(mockLink.remove).toHaveBeenCalled();
    });

    test('handleDownloadPdf should be generate and download file pdf', () => {
        jest.spyOn(document, 'createElement').mockImplementation(() => mockLink);

        DownloadButtonComponet.handleDownloadPdf(pdf, filters[0], 'descriptive');

        expect(mockLink.target).toBe('_blank');
        expect(mockLink.download).toBe(`Descriptives_${filters[0].country}_${filters[0].year}.pdf`);
        expect(mockLink.click).toHaveBeenCalled();
        expect(mockLink.remove).toHaveBeenCalled();
    });    
});