import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import './PdpGrid.css';

const categoryTitles = {
  'Father_Occ': 'Father\'s Occupation',
  'Mother_Occ': 'Mother\'s Occupation',
  'Sex': 'Sex',
  'Father_Edu': 'Father\'s Education',
  'Mother_Edu': 'Mother\'s Education',
  'Ethnicity': 'Ethnicity',
  'Birth_Area': 'Birth Area'
};

const barPlotColors = {
  Ethnicity: "#3498db", // Cyan
  Sex: "#e74c3c", // Orange
  Father_Occ: "#f1c40f", // Yellow
  Mother_Occ: "#34495e", // Blue
  Father_Edu: "#2ecc71", // Green
  Mother_Edu: "#9b59b6", // Purple
  Birth_Area: "#e67e22", // Brown
};


const drawPdpChart = (subset, containerId) => {
  // console.log(subset, containerId);
  const margin = { top: 20, right: 20, bottom: 80, left: 50 };
  const width = 600 - margin.left - margin.right;
  const height = 480 - margin.top - margin.bottom;

  d3.select(`#${containerId}`).select("svg").remove();

  const svg = d3.select(`#${containerId}`)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .range([0, width])
    .domain(subset.data.map(d => d.cat))
    .padding(0.1);

  const yMaxValue = d3.max(subset.data, d => Math.abs(+d.value2)); 
  // const yMinValue = d3.min(subset.data, d => Math.abs(+d.value2));

  const y = d3.scaleLinear()
    .domain([-yMaxValue, yMaxValue])
    .range([height, 0]);

  // svg.append('g')
  //   .attr('transform', `translate(0,${y(0)})`)
  //   .call(d3.axisBottom(x));

  // svg.append('g')
  //   .call(d3.axisLeft(y));

  svg.selectAll('pdp-bar')
    .data(subset.data)
    .enter()
    .append('rect')
    .attr('x', d => x(d.cat))
    .attr('y', d => y(Math.max(0, +d.value2)))
    .attr('width', x.bandwidth())
    .attr('height', d => Math.abs(y(d.value2) - y(0)))
    .attr('fill', barPlotColors[subset.category]);

  svg.selectAll('.pdp-text')
    .data(subset.data)
    .enter()
    .append('text')
    .attr('class', 'pdp-label')
    .attr('x', d => x(d.cat) + x.bandwidth() / 2)
    .attr('y', d => {
      return +d.value2 > 0 ? y(+d.value2) + 15 : y(+d.value2) - 5;
    })
    .attr('text-anchor', 'middle')
    // .style('fill', 'black')
    // .text(d => d.share);

  svg.append('g')
    .attr('transform', `translate(0,${y(0)})`)
    .call(d3.axisBottom(x))
    .selectAll('.tick text')
    .style('text-anchor', 'start')
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .attr('transform', 'translate(0,45)')
    .attr('transform', 'rotate(45)')
    .attr('dy', '0.35em');

  svg.append('g')
    .call(d3.axisLeft(y));

  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -10)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .text(categoryTitles[subset.category]);

  svg.selectAll('.tick text')
    .text(d => {
      const item = subset.data.find(item => item.cat === d);
      return item ? item.class : d;
    });
};

const PdpGrid = ({ filters }) => {
  const [data, setData] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const { country, year } = filters;

    d3.csv(`/data/pdp/pdp_${country}_${year}.csv`).then(data => {
      // console.log('PdpGrid data:', data);
      const categories = [
        'Father_Occ', // 'Father\'s Occupation',
        'Mother_Occ', // 'Mother\'s Occupation',
        'Sex',
        'Father_Edu', // 'Father\'s Education',
        'Mother_Edu', // 'Mother\'s Education',
        'Ethnicity',
        'Birth_Area', // 'Birth Area',
      ];
      const subsets = categories.map(category => ({
        category,
        data: data.filter(d => d.var === category)
      })).filter(subset => subset.data.length > 0);
      setData(subsets);
    });
  }, [filters]);

  useEffect(() => {
    // console.log('PdpGrid data redraw:', data);
    if (data.length > 0) {
      data.slice(currentSlide * 2, currentSlide * 2 + 2).forEach((subset, index) => {
        drawPdpChart(subset, `plot${index}`);
      });
    }
  }, [data, currentSlide]);

  const nextSlide = () => {
    if (currentSlide < Math.floor(data.length / 2)) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  if (data.length === 0) return <p>No available data!</p>;

  return (
    <div className="pdp-grid-container">
      <button className="pdp-nav-button pdp-nav-left" onClick={prevSlide}>&lt;</button>
      <div className="pdp-grid">
        {[0, 1].map(index => (
          <div id={`plot${index}`} className="pdp-plot" key={index}></div>
        ))}
      </div>
      <button className="pdp-nav-button pdp-nav-right" onClick={nextSlide}>&gt;</button>
    </div>
  );
};

export default PdpGrid;
