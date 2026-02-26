const worldmapUrl = 'https://pablovem.github.io/data-viz-geom/data/world.geojson';
const finalDataUrl = 'https://pablovem.github.io/data-viz-geom/data/processed/final.csv';
const finalTableDataUrl = 'https://pablovem.github.io/data-viz-geom/data/processed/final_table.csv';

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

const DATA_COLUMNS = {
  Country: 'c',
  Year: 'y',
  Region: 'Region',
  Measure: 'Measure',
  Approach: 'Approach',
  Latest: 'Latest',
};

const ALL_CIRCUMSTANCES = 'all';
const MEASURE_GINI = 'Gini';
const PERSPECTIVE_EX_POST_TREE = 'Ex-Post Tree';
const APPROACH_RELATIVE = 'Relative';
const VARIABLE_CONSUMPTION = 'Consumption';

let worldData;
let tableData;

const measureDropdown = $('.measure');
const approachDropdown = $('.approach');
const perspectiveDropdown = $('#perspective');
const variableDropdown = $('#variable');
const yearDropdown = $('#year');
const regionDropdown = $('#region');
const countryDropdown = $('#country');

measureDropdown.on('change', handleMeasureChange);
approachDropdown.on('change', handleApproachChange);
perspectiveDropdown.on('change', handlePerspectiveChange);
variableDropdown.on('change', handleVariableChange);
yearDropdown.on('change', handleYearChange);
regionDropdown.on('change', handleRegionChange);
countryDropdown.on('change', handleCountryChange);

function loadCsvData() {
  Promise.all([d3.csv(finalDataUrl), d3.csv(finalTableDataUrl)])
    .then(function (data) {
      worldData = data[0]; // final.csv data
      // console.log('loaded data:', worldData.length, worldData);
      tableData = data[1]; // final_table.csv data
      // console.log('loaded table data:', tableData.length, tableData);
      updateVisualization();
    })
    .catch((err) => {
      console.log('Error loading CSV data:', err);
    })
    .finally(() => {
      console.log('Done reading data');
    });
}

$(document).ready(function () {
  loadCsvData();
  toggleFilters('world-view');
  $('#world-view').addClass('active');

  var tooltipDescriptions = {
    'measure': 'You can select the inequality index, choosing between Gini (default) or MLD. Please, refrain from comparing the Gini index of one country with the MLD index of another country, or the same country across different years. The Gini coefficient has perhaps become the ‘default’ measure of inequality, ranging from zero to one. When it equals zero, everybody earns the same income: perfect equality. A Gini of one means that all resources go to one person: maximal inequality. In practice, societies range somewhere between these extremes. MLD stands for Mean Logarithmic Deviation. It is another way to measure inequality, which is more sensitive to gaps in the bottom of the distribution. The minimum value for MLD is also zero, but it doesn’t have a maximum.',
    'perspective': 'You can choose between Ex-Ante IOp (default) and Ex-Post IOp. These perspectives are independent aspects of IOp, so it is not uncommon for them to lead to different conclusions about the state of social justice in a country. You can also select Total Sample Inequality. The ex-ante approach is based on the idea that the set of opportunities open to individuals in a given type, before they exert any effort or make any choices, should be of equal value. Ex-ante inequality of opportunity is then the inequality between the values of these opportunity sets, often represented by the average income for each type. The ex-post approach is based on the idea that the outcomes of individuals exerting the same degree of effort (or responsibility) should be equal. If one takes the relative position (or rank) of a person in her type’s income distribution to be an indicator of her relative effort, then ex-post inequality of opportunity is just an aggregation of differences across these distributions, at each and every rank.',
    'approach': 'You can select between Absolute (default) and Relative approaches. Note that two countries with the same Absolute IOp may exhibit different Relative IOp values if they have varying levels of Total Inequality. Absolute and Relative measures are different ways to communicate Inequality of Opportunities (IOp). For example, if the GINI of Spain is 0.3 and the absolute Inequality of Opportunities (as calculated by the algorithms) is 0.15, then the relative Inequality of Opportunities is 0.15/0.3 or 50%. In other words, we can say that half of total inequality in Spain is explained by Inequality of Opportunities.',
    'variable': 'You can select between IOp estimated over disposable household income or consumption expenditure. Income is “disposable household income”, i.e. the sum of all incomes going to a household over a certain period, minus taxes. Consumption is “household expenditure”, i.e. the sum of all monetary outflows in the household (e.g. food, clothes, energy, transportation etc.) over a period of time. While income is our preferred outcome, developing countries often have issues when collecting this information as it fluctuates a lot and can come from many different sources. So, consumption is often used to measure wellbeing – and inequality – in many of those countries.'
  };

  $('.tooltip-trigger').on('mouseenter', function () {
    var tooltipKey = $(this).data('tooltip');
    var tooltipText = tooltipDescriptions[tooltipKey];

    $('.filter-description').html(tooltipText);

    $('.filter-description').css({
      'display': 'block',
      'top': $(this).position().top + $(this).outerHeight(),
      'left': $(this).position().left
    });
  });

  $('.tooltip-trigger').on('mouseleave', function () {
    $('.filter-description').css('display', 'none');
  });
});

$('#world-view').on('click', function () {
  $(this).addClass('active');
  $('#table-view').removeClass('active');
  $('#time-series-view').removeClass('active');
  updateVisualization();
  toggleFilters('world-view');
});

$('#table-view').on('click', function () {
  $(this).addClass('active');
  $('#world-view').removeClass('active');
  $('#time-series-view').removeClass('active');
  updateTable();
  toggleFilters('table-view');
});

$('#time-series-view').on('click', function () {
  $(this).addClass('active');
  $('#world-view').removeClass('active');
  $('#table-view').removeClass('active');
  populateCountryDropdown();
  updateTimeSeriesChart();
  toggleFilters('time-series-view');
});

function toggleFilters(visualizationMode) {
  if (visualizationMode === 'world-view') {
    $('#description').hide();
    $('#world-view-filters').show();
    $('#chart-container').show();
    $('#table-view-filters').hide();
    $('#table-container').hide();
    $('#table-description').hide();
    $('#time-series-filters').hide();
  } else if (visualizationMode === 'table-view') {
    $('#description').show();
    $('#world-view-filters').hide();
    $('#chart-container').hide();
    $('#table-view-filters').show();
    $('#table-container').show();
    $('#table-description').show();
    $('#time-series-filters').hide();
  } else if (visualizationMode === 'time-series-view') {
    $('#description').hide();
    $('#world-view-filters').hide();
    $('#chart-container').hide();
    $('#table-view-filters').hide();
    $('#table-container').hide();
    $('#table-description').hide();
    $('#time-series-filters').show();
  }
}

function handleMeasureChange() {
  updateActiveVisualization();
}

function handleApproachChange() {
  updateActiveVisualization();
}

function handlePerspectiveChange() {
  updateActiveVisualization();
}

function handleVariableChange() {
  updateActiveVisualization();
}

function handleYearChange() {
  updateActiveVisualization();
}

function handleRegionChange() {
  updateActiveVisualization();
}

function handleCountryChange() {
  updateActiveVisualization();
}

function updateActiveVisualization() {
  const visualizationMode = $('#visualization .active').attr('id');
  switch (visualizationMode) {
    case 'world-view':
      updateVisualization();
      break;
    case 'table-view':
      updateTable();
      break;
    case 'time-series-view':
      updateTimeSeriesChart();
      break;
  }
}

function updateVisualization() {
  const measure = measureDropdown.val();
  const perspective = perspectiveDropdown.val();
  const approach = approachDropdown.val();
  const variable = variableDropdown.val();

  console.log('Measure:', measure);
  console.log('Perspective:', perspective);
  console.log('Approach:', approach);
  console.log('Variable:', variable);

  updateChoropleth(measure, perspective, approach, variable);
}

function updateTable() {
  const measure = measureDropdown.val();
  const approach = approachDropdown.val();
  const year = yearDropdown.val();
  const region = regionDropdown.val();

  const filteredData = filterTableData(tableData, measure, approach, year, region);
  console.log('updated tableData:', filteredData.length, filteredData);

  $('#table-container').empty();

  const table = $('<table>').addClass('table');

  const thead = $('<thead>').appendTo(table);
  const headerRow = $('<tr>').appendTo(thead);
  $('<th>').text('Name').appendTo(headerRow);
  $('<th>').text('Year').appendTo(headerRow);
  $('<th>').text('Total Inequality').appendTo(headerRow);
  $('<th>').text('IOp Ex-Ante RF').appendTo(headerRow);
  $('<th>').text('IOp Ex-Post').appendTo(headerRow);

  const tbody = $('<tbody>').appendTo(table);

  filteredData.forEach(row => {
    const dataRow = $('<tr>').appendTo(tbody);
    $('<td>').text(row.Name).appendTo(dataRow);
    $('<td>').text(row.Year).appendTo(dataRow);
    $('<td>').text(row['Total Inequality']).appendTo(dataRow);
    $('<td>').text(row['IOp Ex-Ante RF']).appendTo(dataRow);
    $('<td>').text(row['IOp Ex-Post']).appendTo(dataRow);
  });

  $('#table-container').append(table);
}

function updateTimeSeriesChart() {
  const measure = measureDropdown.val();
  const perspective = perspectiveDropdown.val();
  const approach = approachDropdown.val();
  const variable = variableDropdown.val();
  const selectedCountries = $('#country').val() || [];

  const filteredData = worldData.filter(d =>
    selectedCountries.includes(d[COLUMNS.Country]) &&
    d[COLUMNS.Measure] === measure &&
    d[COLUMNS.Perspective] === perspective &&
    d[COLUMNS.Approach] === approach &&
    d[COLUMNS.Variable] === variable &&
    d[COLUMNS.Circumstances] === ALL_CIRCUMSTANCES
  );

  console.log('filteredData:', filteredData.length, filteredData);

  filteredData.forEach(d => {
    d.date = d3.timeParse('%Y')(d[COLUMNS.Year]);
    d.value = +d[COLUMNS.Value];
  });

  filteredData.sort((a, b) => d3.ascending(a.date, b.date));

  renderTimeSeriesChart(filteredData);
}

function populateCountryDropdown() {
  const countryData = worldData.map(data => ({
    code: data[COLUMNS.Country],
    name: data[COLUMNS.Name]
  }));

  const uniqueCountries = Array.from(new Map(countryData.map(item => [item.code, item])).values());

  const countryDropdown = $('#country');
  uniqueCountries.forEach(country => {
    countryDropdown.append($('<option>', {
      value: country.code,
      text: country.name
    }));
  });
}

const width = 1200;
const height = 600;

const svg = d3.select('#chart')
  .append('svg')
  .attr('width', width)
  .attr('height', height);

function calculateTickValues(domainMin, domainMax, numTicks) {
  const tickValues = [];
  const min = parseFloat(domainMin);
  const max = parseFloat(domainMax);
  const step = (max - min) / (numTicks - 1);
  for (let i = 0; i < numTicks; i++) {
    tickValues.push(min + step * i);
  }
  return tickValues;
}

function updateColorBarTicks(color, domainMin, domainMax) {
  const numTicks = 10;
  const tickValues = calculateTickValues(domainMin, domainMax, numTicks);
  const colorBarTicks = d3.select('#color-bar-ticks');

  colorBarTicks.selectAll('.color-bar-tick').remove();

  colorBarTicks.selectAll('.color-bar-tick')
    .data(tickValues)
    .enter()
    .append('div')
    .attr('class', 'color-bar-tick')
    .style('background-color', d => {
      return color(d);
    })
    .text(d => d.toFixed(2));
}

function filterWorldData(data, measure, perspective, approach, variable) {
  // Assume Gini, Ex-Post (Tree), Relative, Consumption
  // df_map = df[df['Circumstances'] == 'all'].copy()
  // df_map = df_map[df_map['latest'] == 1].copy()
  // df_map = df_map[df_map['Perspective'] == 'Ex-Post Tree'].copy()
  // df_map = df_map[df_map['Measure'] == 'Gini'].copy()
  // df_map = df_map[df_map['Approach'] == 'Relative'].copy()
  // df_map = df_map[df_map['var'] == 'Consumption'].copy()
  return data.filter(row =>
    row[COLUMNS.Circumstances] === ALL_CIRCUMSTANCES &&
    parseInt(row[COLUMNS.Latest]) === 1 &&
    row[COLUMNS.Perspective] === perspective &&
    row[COLUMNS.Measure] === measure &&
    row[COLUMNS.Approach] === approach &&
    row[COLUMNS.Variable] === variable
  );
}

function filterTableData(data, measure, approach, year, regions) {
  let filteredData = data.filter(row =>
    row[DATA_COLUMNS.Measure] === measure &&
    row[DATA_COLUMNS.Approach] === approach &&
    (year === 'Latest' ? row[DATA_COLUMNS.Latest] === '1' : true) &&
    regions.includes(row.Region)
  );

  return filteredData;
}

function updateChoropleth(measure, perspective, approach, variable) {
  console.log('updateChoropleth:', measure, perspective, approach, variable);

  if (!worldData) return;

  const mapData = filterWorldData(worldData, measure, perspective, approach, variable);
  console.log('updated mapData:', mapData.length, mapData);

  svg.selectAll('path').remove();

  d3.json(worldmapUrl) // only needed for world map
    .then(function (geojson) {
      geojson.features = geojson.features.filter(feature => feature.properties.name !== 'Antarctica');

      const projection = d3.geoMercator()
        .fitSize([width, height], geojson)

      const path = d3.geoPath()
        .projection(projection);

      const domainMin = d3.min(mapData, datum => datum.Value);
      const domainMax = d3.max(mapData, datum => datum.Value);
      console.log('domain:', domainMin, domainMax);
      const color = d3.scaleSequential()
        .domain([domainMin, domainMax])
        .interpolator(d3.interpolate('#a62bff', '#ffff00'));

      console.warn('domain colors:', color(domainMin), color(domainMax));

      const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

      updateColorBarTicks(color, domainMin, domainMax);

      svg.selectAll('path')
        .data(geojson.features)
        .enter()
        .append('path')
        .attr('d', path)
        .style('fill', datum => {
          // console.log(d);
          const country = mapData.find(country => country.iso === datum.id);
          let fillColor = '#ddd';
          if (country) {
            fillColor = color(country.Value);
            // console.log(fillColor);
          }
          return fillColor;
        })
        .style('stroke-width', '1')
        .style('stroke', '#777')
        .on('mouseover', (event, datum) => { // (datum, index) = (d, i) is deprecated
          // console.log('mouseover:', event, datum);
          const country = mapData.find(country => country.iso === datum.id);
          if (country) {
            const { name, Value } = country;
            const value = parseFloat(Value).toFixed(2);
            const tooltipContent = `<strong>${name}</strong><br>value=${value}`;
            tooltip.transition()
              .duration(300)
              .style('opacity', 1);
            tooltip.html(tooltipContent)
              .style('left', `${event.pageX}px`)
              .style('top', `${event.pageY}px`);
          }
        })
        .on('mouseout', (_event, _datum) => { // (datum, index) = (d, i) is deprecated
          // console.log('mouseout:', event, datum);
          tooltip.transition()
            .duration(400)
            .style('opacity', 0);
        });
    })
    .catch(function (err) {
      console.log('error loading geojson:', err);
    })
    .finally(() => {
      console.log('done loading geojson');
    });
}

function renderTimeSeriesChart(data) {
  const svg = d3.select('#time-series');
  console.log('data:', data);

  svg.selectAll('*').remove();

  const margin = { top: 20, right: 20, bottom: 30, left: 50 };
  const width = svg.node().getBoundingClientRect().width * 0.9 - margin.left - margin.right;
  const height = svg.node().getBoundingClientRect().height - margin.top - margin.bottom;

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .rangeRound([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .rangeRound([height, 0]);

  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%Y')))
    .append('text')
    .attr('fill', '#000')
    .attr('x', width)
    .attr('dy', '-0.5em')
    .attr('text-anchor', 'end')
    .text('Year');

  g.append('g')
    .call(d3.axisLeft(y))
    .append('text')
    .attr('fill', '#000')
    .attr('transform', 'rotate(-90)')
    .attr('y', 6)
    .attr('dy', '0.71em')
    .attr('text-anchor', 'end')
    .text('Value');

  const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.value));

  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .attr('stroke-width', 2)
    .attr('d', line);

  const tooltip = d3.select("#time-series-tooltip");

  g.selectAll('.dot')
    .data(data)
    .enter().append('circle')
    .attr('class', 'dot')
    .attr('cx', d => x(d.date))
    .attr('cy', d => y(d.value))
    .attr('r', 7)
    .attr('fill', 'steelblue')
    .attr('stroke', '#fff')
    .on('mouseover', function (event, d) {
      tooltip.transition()
        .duration(200)
        .style('opacity', .9);
      tooltip.html('Year: ' + d3.timeFormat('%Y')(d.date) + '<br/>Value: ' + d.value.toFixed(2))
        .style('left', (event.pageX + 5) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function (d) {
      tooltip.transition()
        .duration(500)
        .style('opacity', 0);
    });
}

