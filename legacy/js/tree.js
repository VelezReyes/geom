const treeData = {
  name: 'Birth Area',
  children: [
    {
      name: 'Mother Education',
      children: [
        { 
          name: 'Birth Area',
          children: [
            { name: 'abc' },
            { name: 'def' }
          ]
        },
        { name: 'Birth Area' }
      ]
    },
    {
      name: 'Father Education',
      children: [
        { name: 'xyz' },
        { name: 'pqr' }
      ]
    }
  ]
};

const width = 800;
const height = 600;

const svg = d3.select('#chart')
  .attr('width', width)
  .attr('height', height)
  .append('g')
  .attr('transform', 'translate(200, 50)');

// const treeLayout = d3.tree().size([height - 100, width - 200]);
const treeLayout = d3.tree().size([width - 200, height - 100]);

const root = d3.hierarchy(treeData);

const tree = treeLayout(root);

svg.selectAll(".link")
  .data(tree.links())
  .enter().append("path")
  .attr("class", "link")
  .attr("d", d3.linkVertical()
    .x(d => d.x)
    .y(d => d.y));

const node = svg.selectAll('.node')
  .data(tree.descendants())
  .enter().append('g')
  .attr('class', 'node')
  // .attr('transform', d => `translate(${d.y},${d.x})`);
  .attr("transform", d => `translate(${d.x},${d.y})`);

node.append('circle')
  .attr('r', 5);

// node.append('text')
//   .attr('dy', '0.31em')
//   .attr('x', d => d.children ? -8 : 8)
//   .style('text-anchor', d => d.children ? 'end' : 'start')
//   .text(d => d.data.name)
//   .clone(true).lower()
//   .attr('stroke-linejoin', 'round')
//   .attr('stroke-width', 3)
//   .attr('stroke', 'white');

node.append("text")
  .attr("dy", "0.31em")
  .attr("y", d => d.children ? -8 : 8) // Swap y position for parent and child nodes
  .style("text-anchor", "middle")
  .text(d => d.data.name)
  .clone(true).lower()
  .attr("stroke-linejoin", "round")
  .attr("stroke-width", 3)
  .attr("stroke", "white");
