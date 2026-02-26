import React, { useState, useEffect, useContext } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from 'react-router-dom';
// Style
import './App.css';
// Contexts
import { VisualizationContext } from './contexts/Visualization.context';
import { FilterContext } from './contexts/Filter.context';
// Hooks
import useDataFetch from './hooks/useDataFetch';
import usePDFUrls from './hooks/usePdfUrls';
// Components
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import Filter from './components/Filter';
import Map from './components/Map';
import Table from './components/Table';
import TimeSeries from './TimeSeries';
import PDFViewer from './components/PDFViewer';
import Decomposition from './Decomposition';
import TypesDescription from './TypesDescription';
import PdpGrid from './components/PdpGrid';
import Footer from './components/Footer';
import HoverHodesProvider from './contexts/TreeBubble.context';
import Alluvial from './components/Alluvial';
import routes from './utils/routes';
import { filterConfig, getFilterLabel } from './utils/filters';
import TreeGraph from './TreeGraph';
import BubblePlot from './BubblePlot';
import VisualizationTreeBubbleButton from './components/VisualizationTreeBubbleButton';



function App() {
  const [countryData, setCountryData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { visualization, setVisualization, showBubble, setShowBubble } = useContext(VisualizationContext);
  const { filters, filterOptions, setFilters, setFilterOptions } = useContext(FilterContext)
  const { worldData, tableData, countryTableData } = useDataFetch();
  const pdfs = usePDFUrls(filters, countryData);

  // query params -> state
  useEffect(() => {
    console.log('useEffect:', location.search, visualization);
    console.log('location:', location);
    const path = location.pathname;
    const queryParams = new URLSearchParams(location.search);
    const visualizationParam = queryParams.get('visualization');

    console.log('Path:', path);
    console.log('Visualization:', visualizationParam);
    console.log('Search:', location.search);

    if (visualizationParam) {
      console.log('Setting visualization:', visualizationParam);
      setVisualization(visualizationParam);
    } else {
      console.log('Setting default visualization');
      if (path.includes('/world')) {
        // setFilters((prevFilters) => ({
        //   ...prevFilters,
        // }));
        setVisualization('map');
      } else if (path.includes('/country')) {
        // setFilters((prevFilters) => ({
        //   ...prevFilters,
        //   anteFormat: 'chart',
        //   postFormat: 'chart',
        //   country: 'IT',
        //   year: '2019',
        // }));
        setVisualization('ante');
      }
    }
  }, [location.search, setVisualization]);

  // state -> query params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    queryParams.set('visualization', visualization);
    navigate(`${location.pathname}?${queryParams.toString()}`, { replace: true });
  }, [visualization, navigate, location.pathname]);

  // load countries data (name, available years) and set filter options
  useEffect(() => {
    fetch('/countries.json')
      .then((response) => response.json())
      .then((data) => {
        setCountryData(data);
        // update filter options based on country and available years, sort countries by name
        const countryOptions = Object.entries(data)
          .map(([key, value]) => ({
            value: key,
            label: value.name,
            years: value.years,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setFilterOptions((prevOptions) => ({
          ...prevOptions,
          country: countryOptions,
        }));
        const countries = countryOptions.map(option => ({
          value: option.value,
          label: option.label,
        }));
        setFilterOptions(prevOptions => ({
          ...prevOptions,
          countries,
        }));
      })
      .catch((error) => console.error('Error loading available data for each country:', error));
  }, []);

  useEffect(() => {
    if (filters.country) {
      const selectedCountry = filterOptions.country.find(
        (c) => c.value === filters.country
      );
      if (selectedCountry && selectedCountry.years) {
        const yearOptions = selectedCountry.years.map((year) => ({
          value: year,
          label: year.toString(),
        }));
        setFilterOptions((prevOptions) => ({
          ...prevOptions,
          year: yearOptions,
        }));
        if (
          yearOptions.length > 0 &&
          (!filters.year || !selectedCountry.years.includes(filters.year))
        ) {
          setFilters((prevFilters) => ({
            ...prevFilters,
            year: yearOptions[yearOptions.length - 1].value,
          }));
        }
      } else {
        setFilterOptions((prevOptions) => ({
          ...prevOptions,
          year: [],
        }));
        setFilters((prevFilters) => ({
          ...prevFilters,
          year: "",
        }));
      }
    }
  }, [filters.country, filterOptions.country]);

  const handleFilterChange = (filterName, value) => {
    // console.log(`Filter change: { filterName: ${filterName}}, value: ${value}`);
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: value,
    }));
    if (filterName === "countries") {
      setFilters((prevFilters) => {
        const currentCountries = prevFilters[filterName];
        let newCountries;

        if (Array.isArray(value)) {
          newCountries = value;
        } else {
          if (currentCountries.includes(value)) {
            newCountries = currentCountries.filter(
              (country) => country !== value
            );
          } else {
            newCountries = [...currentCountries, value];
          }
        }

        return {
          ...prevFilters,
          [filterName]: newCountries,
        };
      });
    }
    if (filterName === "country") {
      setFilters((prevFilters) => ({
        ...prevFilters,
        year: "",
      }));
    }
  };

  const renderFilters = (route) => {
    const activeFilters = filterConfig[route][visualization];

    if (!activeFilters) return null;

    return activeFilters.map((filterKey) => (
      <Filter
        key={filterKey}
        label={getFilterLabel(filterKey)}
        options={filterOptions[filterKey]}
        value={filters[filterKey]}
        onChange={(value) => handleFilterChange(filterKey, value)}
      />
    ));
  };

  const renderVisualization = () => {
    switch (visualization) {
      case 'map':
        return <Map data={worldData} filters={filters} />;
      case 'table':
        return <Table data={tableData} filters={filters} tableType='general' />;
      case 'chart':
        return <TimeSeries data={worldData} filters={filters} />;
      case 'table':
        return <Table data={tableData} filters={filters} />;
      case 'ante':
        switch (filters.anteFormat) {
          case 'chart':
            return (
              <HoverHodesProvider>
                <VisualizationTreeBubbleButton />
                <div className='chart-container'>
                  <TreeGraph />
                  {showBubble && <BubblePlot />}
                </div>
              </HoverHodesProvider>
            );
          case 'pdf':
            return <PDFViewer fileUrl={pdfs[visualization]} />;
          case 'decomposition':
            return (
              <Decomposition
                data={filterOptions.country}
                filters={filters}
                visualization={visualization}
              />
            );
          case 'pdp':
            return <PdpGrid filters={filters} />;
          default:
            return null;
        }
      case 'post':
        switch (filters.postFormat) {
          case 'chart':
            return (
              <HoverHodesProvider>
                <VisualizationTreeBubbleButton />
                <div className='chart-container'>
                  <TreeGraph />
                  {showBubble && <BubblePlot />}
                </div>
              </HoverHodesProvider>
            );
          case 'pdf':
            return <PDFViewer fileUrl={pdfs[visualization]} />;
          case 'decomposition':
            return (
              <Decomposition
                data={filterOptions.country}
                filters={filters}
                visualization={visualization}
              />
            );
          case 'types':
            return (
              <>
                <PDFViewer fileUrl={pdfs['types']} />
                <TypesDescription filters={filters} />
              </>
            );
          default:
            return null;
        }
      case 'alluvial':
        return <Alluvial />;
      case 'descriptive':
        return <PDFViewer fileUrl={pdfs[visualization]} />;
      case 'countryTable':
        return <Table data={countryTableData} filters={filters} tableType='country' />;
      default:
        return null;
    }
  };

  return (
    <div className="App">
      <Header />
      <Routes>
        {routes.map(({ path, route }) => (
          <Route
            key={path}
            path={path}
            element={<ControlPanel route={route} renderFilters={renderFilters} />}
          />
        ))}
        <Route path="*" element={<Navigate to="/country" replace />} />
      </Routes>
      <main id='main-wrapper-components'>
        {renderVisualization()}
      </main>
      <Footer />
    </div>
  );
}


export default App;
