import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { legendColor } from 'd3-svg-legend';
import ResizeObserver from 'resize-observer-polyfill';

import Tooltip from '../Tooltip';

const COLUMNS = {
  Name: 'name',
  ISO: 'iso',
  Year: 'y',
  Country: 'c',
  Circumstances: 'Circumstances',
  Latest: 'latest',
  Variable: 'var',
  Region: 'Region',
  Approach1: 'Approach1',
  Value: 'Value',
  Measure: 'Measure',
  Approach: 'Approach',
  Perspective: 'Perspective'
};

function filterWorldData(data, filters) {
  return data.filter(row =>
    parseInt(row[COLUMNS.Latest], 10) === 1 &&
    row[COLUMNS.Perspective] === filters.perspective &&
    row[COLUMNS.Measure] === filters.measure &&
    row[COLUMNS.Approach] === filters.approach &&
    (filters.variable === "Both" || row[COLUMNS.Variable] === filters.variable)
  );
}

function Map({ data, filters }) {
  const ref = useRef();
  const wrapperRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState({ content: null, position: { x: 0, y: 0 } });

  useEffect(() => {
    d3.json('/countries.geojson').then(data => {
      setGeoData(data);
      setLoading(false);
    }).catch(error => {
      console.error('Error loading the GeoJSON file: ', error);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      setDimensions({
        width: entries[0].contentRect.width,
        height: 600
      });
    });
    resizeObserver.observe(wrapperRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const { approach, measure, perspective, variable } = filters;
    if (!data || !geoData || !approach || !measure || !perspective || !variable) {
      console.log('Data or filters are incomplete.');
      return;
    }

    const svg = d3.select(ref.current);
    const width = dimensions.width;
    const height = dimensions.height;
    const margin = { top: 20, right: 20, bottom: 50, left: 40 };

    const filteredData = filterWorldData(data, filters);

    let domainMin = d3.min(filteredData, d => parseFloat(d[COLUMNS.Value]));
    let domainMax = d3.max(filteredData, d => parseFloat(d[COLUMNS.Value]));

    const colorScale = d3.scaleSequential()
      .domain([domainMin, domainMax])
      .interpolator(d3.interpolate('#ffff00', '#a62bff'));

    // remove Antarctica
    geoData.features = geoData.features.filter(feature => feature.properties.ADMIN !== 'Antarctica');

    const projection = d3.geoEqualEarth()
      .fitSize([width - margin.left - margin.right, height - margin.top - margin.bottom], geoData);
    const pathGenerator = d3.geoPath().projection(projection);

    svg.selectAll('path').remove();  // Clear existing paths to redraw

    svg.selectAll('path')
      .data(geoData.features)
      .enter()
      .append('path')
      .attr('d', pathGenerator)
      .style('fill', datum => {
        const countryData = filteredData.find(country => country[COLUMNS.ISO] === datum.properties.ISO_A3);
        return countryData ? colorScale(countryData[COLUMNS.Value]) : '#ddd';
      })
      .style('stroke-width', '1')
      .style('stroke', '#777')
      .on('mouseover', (event, datum) => {
        const countryData = filteredData.find(country => country[COLUMNS.ISO] === datum.properties.ISO_A3);
        setTooltip({
          content: `${datum.properties.ADMIN}: ${countryData ? Math.round(countryData[COLUMNS.Value] * 100) / 100 : 'No available data'}`,
          position: { x: event.pageX, y: event.pageY }
        });
      })
      .on('mouseout', () => setTooltip({ content: null, position: { x: 0, y: 0 } }));

    createLegend(svg, colorScale, width, margin, height, filteredData);

    return () => svg.selectAll('*').remove();
  }, [geoData, data, filters, dimensions]);

  function createLegend(svg, colorScale, width, margin, height) {

    const [legendDomainMin, legendDomainMax] = colorScale.domain();
    const legendWidth = 600;
    const legendHeight = 20;
    const svgWidth = width;
    const svgHeight = height;

    const defs = svg.select("defs").empty() ? svg.append("defs") : svg.select("defs");
    defs.select("#legend-gradient").remove();

    const linearGradient = defs.append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");

    const numStops = 20;
    const stopData = d3.range(numStops).map(i => ({
      offset: `${(i / (numStops - 1)) * 100}%`,
      color: colorScale(legendDomainMin + (i / (numStops - 1)) * (legendDomainMax - legendDomainMin))
    }));

    linearGradient.selectAll("stop")
      .data(stopData)
      .join("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);

    svg.append("rect")
      .attr("x", (svgWidth - legendWidth) / 2)
      .attr("y", svgHeight - legendHeight - 40)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)");

    svg.append("text")
      .attr("x", (svgWidth - legendWidth) / 2 + 120)
      .attr("y", svgHeight - legendHeight - 55)
      .text("Inequality of Opportunity Ex Ante Random Forest Income Gini index")
      .style("font-size", "12px");

    svg.append("text")
      .attr("x", (svgWidth - legendWidth) / 2 - 6)
      .attr("y", svgHeight - legendHeight)
      .text("Less")
      .style("font-size", "12px");

    svg.append("text")
      .attr("x", (svgWidth - legendWidth) / 2 - 20)
      .attr("y", svgHeight - legendHeight + 16)
      .text("Inequality")
      .style("font-size", "12px");

    svg.append("text")
      .attr("x", (svgWidth + legendWidth) / 2 + 20)
      .attr("y", svgHeight - legendHeight)
      .attr("text-anchor", "end")
      .text("More")
      .style("font-size", "12px");

    svg.append("text")
      .attr("x", (svgWidth + legendWidth) / 2 + 32)
      .attr("y", svgHeight - legendHeight + 16)
      .attr("text-anchor", "end")
      .text("Inequality")
      .style("font-size", "12px");

    const tickValues = d3.ticks(legendDomainMin, legendDomainMax, 5);

    const legendScale = d3.scaleLinear()
      .domain([legendDomainMin, legendDomainMax])
      .range([(svgWidth - legendWidth) / 2, (svgWidth - legendWidth) / 2 + legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .tickValues(tickValues)
      .tickSize(-legendHeight)
      .tickFormat((d, i) =>
        (i === 0 || i === tickValues.length - 1)
          ? d3.format(".2f")(d)
          : d3.format(".2f")(d)
      );

    const axisGroup = svg.append("g")
      .attr("transform", `translate(0, ${svgHeight - 40})`)
      .call(legendAxis);

    axisGroup.selectAll(".tick line")
      .style("stroke", "white")
      .style("stroke-width", "3px");

    axisGroup.selectAll(".tick text")
      .style("fill", "black")
      .style("font-size", "12px");
  }

  const handleDownloadCSV = () => {
    if (!data || !filters) return;
    const filteredData = filterWorldData(data, filters);
    if (!filteredData.length) {
      alert("No hay datos disponibles para descargar con los filtros aplicados.");
      return;
    }
   
    const csv = d3.csvFormat(filteredData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
 
    a.download = `${filters.measure}_${filters.perspective}_${filters.approach}_${filters.variable}_data.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={wrapperRef} style={{ width: '100%' }}>
      {loading && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          Loading data...
        </div>
      )}
      <svg ref={ref} width={dimensions.width} height={dimensions.height}></svg>
      <Tooltip content={tooltip.content} position={tooltip.position} />
      <button 
        onClick={handleDownloadCSV}
        aria-label="CSV"
        style={{
          position: 'absolute',
          top: dimensions.height + 295,
          right: 100,
          zIndex: 1000,
          padding: '8px 12px',
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
     Descargar CSV
      </button> 
    </div>
  );
}

export default Map;
