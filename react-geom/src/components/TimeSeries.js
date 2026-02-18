import React, { useEffect, useState, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';
// Components
import Tooltip from './Tooltip';

const COLUMNS = {
  Country: 'c',
  Measure: 'Measure',
  Perspective: 'Perspective',
  Approach: 'Approach',
  Variable: 'var',
  Circumstances: 'Circumstances',
  Value: 'Value',
  Year: 'y',
};

function filterAndProcessData(data, filters) {
  return data.filter(row =>
    filters.countries.includes(row[COLUMNS.Country]) &&
    row[COLUMNS.Measure] === filters.measure &&
    row[COLUMNS.Perspective] === filters.perspective &&
    row[COLUMNS.Approach] === filters.approach &&
    row[COLUMNS.Variable] === filters.variable &&
    row[COLUMNS.Circumstances] === 'all'
  ).map(d => ({
    ...d,
    date: d3.timeParse('%Y')(d[COLUMNS.Year]),
    value: +d[COLUMNS.Value]
  })).sort((a, b) => d3.ascending(a.date, b.date));
}

function TimeSeries({ data, filters }) {
  const ref = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [tooltip, setTooltip] = useState({ visible: false, content: '', position: { x: 0, y: 0 } });

  const chartData = useMemo(() => filterAndProcessData(data, filters), [data, filters]);

  useEffect(() => {
    if (!chartData.length) return;

    const svg = d3.select(ref.current);
    const margin = { top: 20, right: 120, bottom: 30, left: 40 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    svg.selectAll('*').remove();

    const x = d3.scaleTime().domain(d3.extent(chartData, d => d.date)).range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max(chartData, d => d.value)]).range([height, 0]);
    const color = scaleOrdinal(schemeCategory10);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.timeFormat('%Y')));
    g.append('g').call(d3.axisLeft(y));

    filters.countries.forEach((country, i) => {
      const countryData = chartData.filter(d => d[COLUMNS.Country] === country);
      const path = g.append('path')
        .datum(countryData)
        .attr('fill', 'none')
        .attr('stroke', color(i))
        .attr('stroke-width', 1.5)
        .attr('d', d3.line().x(d => x(d.date)).y(d => y(d.value)))
        .attr('stroke-opacity', 0);

      path.transition().duration(700).attr('stroke-opacity', 1);

      const circles = g.selectAll(`circle.${country}`)
        .data(countryData)
        .enter()
        .append('circle')
        .attr('class', `dot ${country}`)
        .attr('cx', d => x(d.date))
        .attr('cy', d => y(d.value))
        .attr('r', 5)
        .attr('fill', color(i))
        .attr('fill-opacity', 0)
        .on('mouseover', (event, d) => {
          setTooltip({
            visible: true,
            content: `<p><strong>Year:</strong> ${d3.timeFormat('%Y')(d.date)}</p><p><strong>Value:</strong> ${d.value.toFixed(2)}</p>`,
            position: { x: event.pageX, y: event.pageY }
          });
        })
        .on('mouseout', () => setTooltip({ visible: false, content: '', position: { x: 0, y: 0 } }));

      circles.transition().duration(700).attr('fill-opacity', 1);
    });

    // Legend
    const legend = svg.append('g').attr('transform', `translate(${width + margin.left}, ${margin.top})`);
    filters.countries.forEach((country, i) => {
      legend.append('rect')
        .attr('x', 0).attr('y', i * 20)
        .attr('width', 10).attr('height', 10)
        .style('fill', color(i));

      legend.append('text')
        .attr('x', 20).attr('y', i * 20 + 10)
        .text(country)
        .attr('text-anchor', 'start')
        .style('alignment-baseline', 'middle');
    });

    return () => {
      svg.selectAll('*').remove();
    };
  }, [chartData, filters, dimensions]);

  useEffect(() => {
    const observeTarget = ref.current.parentNode;
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setDimensions({ width: entry.contentRect.width, height: 600 });
      }
    });
    resizeObserver.observe(observeTarget);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <>
      <svg ref={ref} width={dimensions.width} height={dimensions.height}></svg>
      <Tooltip content={<div dangerouslySetInnerHTML={{ __html: tooltip.content }} />} position={tooltip.position} />
    </>
  );
}

export default TimeSeries;
