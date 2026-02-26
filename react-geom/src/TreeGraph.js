import React, { useEffect, useState, useRef, useContext } from "react";
import { FilterContext } from "./contexts/Filter.context";
import { VisualizationContext } from "./contexts/Visualization.context";
import { HoverHodesContext } from "./contexts/TreeBubble.context";
import * as d3 from "d3";

import Tooltip from "./Tooltip";
import "./TreeGraph.css";

function traverseTree(node, result = []) {
  if (node.children) {
    node.children.forEach((child) => {
      traverseTree(child, result);
    });
  } else {
    result.push(node.info.Relative_Type_Mean);
  }

  return result;
}

function traverseTreeGetChilds(node, result = []) {
  if (result.length === 0) result.push(node.data.id);
  if (node._children) {
    node._children.forEach((child) => {
      result.push(child.data.id);
      traverseTreeGetChilds(child, result);
    });
  }

  return result;
}

const ExtendedVarNames = {
  Ethnicity: "Ethnicity",
  Sex: "Sex",
  Father_Occ: "Father Occupation",
  Father_Edu: "Father Education",
  Mother_Edu: "Mother Education",
  Mother_Occ: "Mother Occupation",
  Birth_Area: "Birth Area",
  Pop_Share: "Population Share (%)",
  Relative_Type_Mean: "Relative Type Mean",
};

const transitionsSetUp = (link, linkEnter, diagonal, transition, source, root, yScale, margin, showBubble) => {
  // Transition links to their new position.
  const linkUpdate = link
    .merge(linkEnter)
    .transition(transition)
    .attr("d", (d) => {
      // Aquí se aplica el mismo cálculo del offset dinámico
      let translate = 0;
      if (d?.target?.data?.info?.Pop_Share && !showBubble) {
        translate = yScale(d?.target?.data?.info?.Relative_Type_Mean - 0.5)
      }
      const targetAdjusted = translate
        ? {
          x: d.target.x,
          y: translate - margin.top
        }
        : {
          x: d.target.x,
          y: d.target.y
        };
      return diagonal({ source: d.source, target: targetAdjusted });
    });

  // Transition exiting nodes to the parent's new position.
  link
    .exit()
    .transition(transition)
    .remove()
    .attr("d", (d) => {
      const o = { x: source.x + 200, y: source.y + 200 };
      return diagonal({ source: o, target: o });
    });

  // Stash the old positions for transition.
  root.eachBefore((d) => {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

const linksGenerator = (root, gLinkRef, margin, source, diagonal, setTooltip, yScale) => {
  const links = root.links();
  // Update the links…
  const link = gLinkRef.current
    .selectAll("path.link")
    .attr('transform', `translate(0,${margin.top})`)
    .data(links, (d) => d.target.id);

  // Enter any new links at the parent's previous position.
  const linkEnter = link
    .enter()
    .append("path")
    .attr("class", "link")
    .attr('transform', `translate(0,${margin.top})`)
    .attr("d", (d) => {
      const o = { x: source.x0, y: source.y0 };
      const targetAdjusted = d.target.data.isLastChild
        ? { x: d.target.x, y: d.target.y }
        : { x: d.target.x, y: d.target.y };

      return diagonal({ source: o, target: targetAdjusted });
    })
    .on("mouseover", function (event, d) {
      const splitCondition = d.target.data.split_condition
        .split(" -> ")[1]
        .split(",");

      const content = splitCondition.map((condition, i) => (
        <p key={`condition-${i}`}>{condition}</p>
      ));

      setTooltip({
        content: content,
        position: { x: event.pageX + 10, y: event.pageY + 10 },
      });
    })
    .on("mousemove", function (event, d) {
      setTooltip((tooltip) => {
        return {
          content: tooltip.content,
          position: { x: event.pageX + 10, y: event.pageY + 10 },
        };
      });
    })
    .on("mouseout", function () {
      setTooltip({ content: null, position: { x: 0, y: 0 } });
    });

  return { link, linkEnter };
}

const nodesGenerator = (showBubble, nodesThreshold, setHoveredNode, setInactiveNodes, nodes, source, gNodeRef, margin, update, setTooltip, color, transition, generatorSizeNode, yScale, width) => {

  // Update the nodes…
  const node = gNodeRef.current.selectAll("g").data(nodes, (d) => d.id);

  // Enter any new nodes at the parent's previous position.
  const nodeEnter = node
    .enter()
    .append("g")
    .attr("class", (d) => {
      if (!d._children) {
        return `node node-${d.data.info.Box_Number}`;
      }
      return "node";
    })
    .attr("transform", (d) => {

      let translate = 0;
      if (d?.data?.info?.Pop_Share) {
        translate = d?.data?.info?.Pop_Share
      }

      return `translate(${source.x0},${source.y0 + margin.top + (Math.floor(translate) * 300)})`
    })
    .style("fill-opacity", 0)
    .style("stroke-opacity", 0)
    .on("click", (event, d) => {
      const nodeIds = traverseTreeGetChilds(d);

      setInactiveNodes((inactiveNodes) => {
        let newInactiveNodes = [...inactiveNodes];

        // collapse
        if (!nodeIds.every((node) => newInactiveNodes.includes(node))) {
          newInactiveNodes = [...newInactiveNodes, ...nodeIds];
          return newInactiveNodes;
        }
        // expand
        else {
          // Count occurrences of each node
          const nodeCount = newInactiveNodes.reduce((count, node) => {
            count[node] = (count[node] || 0) + 1;
            return count;
          }, {});
          newInactiveNodes = newInactiveNodes.filter((node) => {
            if (nodeIds.includes(node)) {
              if (nodeCount[node] > 1) {
                nodeCount[node]--;
                return true;
              }
              return false;
            }
            return true;
          });
          return newInactiveNodes;
        }
      });

      d.children = d.children ? null : d._children;
      update(event, d);
    })
    .on("mouseover", function (event, d) {
      if (nodes.length > nodesThreshold && d._children) {
        const content = (
          <p>
            <b>{ExtendedVarNames[d.data.nodeName]}</b>
          </p>
        );
        setTooltip({
          content: content,
          position: { x: event.pageX + 10, y: event.pageY + 10 },
        });
      }

      if (!d._children) {
        const data = d.data.info;
        const content = Object.entries(data)
          .filter(([key, value]) =>
            key !== "Box_Number" ? true : false
          )
          .map(([key, value]) => {
            return (
              <p key={key}>
                <b>{ExtendedVarNames[key]}:</b> {value}
              </p>
            );
          });

        setHoveredNode(`node-${d.data.info.Box_Number}`);
        setTooltip({
          content: content,
          position: { x: event.pageX + 10, y: event.pageY + 10 },
        });
      }
    })
    .on("mousemove", function (event, d) {
      setTooltip((tooltip) => {
        return {
          content: tooltip.content,
          position: { x: event.pageX + 10, y: event.pageY + 10 },
        };
      });
    })
    .on("mouseout", function () {
      setHoveredNode("");
      setTooltip({ content: null, position: { x: 0, y: 0 } });
    });

  nodeEnter
    .append("circle")
    .attr("r", 1e-6)
    .style("fill", (d) => {
      return d._children
        ? "black"
        : `${color(d.data.info.Relative_Type_Mean)}`;
    });

  if (nodes.length <= nodesThreshold)
    nodeEnter
      .append("text")
      .attr("dy", "-1em")
      .attr("x", -5)
      .attr("text-anchor", "middle")
      .text((d) => ExtendedVarNames[d.data.nodeName])
      .style("fill-opacity", 1e-6)
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .attr("stroke", "white")
      .attr("paint-order", "stroke");

  // Transition nodes to their new position.
  const nodeUpdate = node
    .merge(nodeEnter)
    .transition(transition)
    .attr("transform", (d, i) => {
      let translate = 0;
      if (d?.data?.info?.Pop_Share && !showBubble) {
        yScale(d?.data?.info?.Pop_Share)
        translate = yScale(d?.data?.info?.Relative_Type_Mean - 0.5)
      }

      return `translate(${d.x},${translate || d.y + margin.top})`
    })
    .style("fill-opacity", 1)
    .style("stroke-opacity", 1)


  nodeUpdate
    .select("circle")
    .attr("r", (d) => {
      if (d._children) {
        return 6;
      } else if (!showBubble) {
        return generatorSizeNode(+d.data.info.Pop_Share);
      } else {
        return 7;
      }

    })
    .style("fill", (d) => {
      if (d._children) return "black";
      else return `${color(d.data.info.Relative_Type_Mean)}`;
    });

  nodeUpdate.select("text").style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  const nodeExit = node
    .exit()
    .transition(transition)
    .remove()
    .attr("transform", (d) => `translate(${source.x},${source.y + margin.top})`)
    .style("fill-opacity", 0)
    .style("stroke-opacity", 0);

  nodeExit.select("circle").attr("r", 1e-6);

  nodeExit.select("text").style("fill-opacity", 1e-6);
}

const printPlot = (data, setTooltip, inactiveNodes, gLinkRef, showBubble, nodesThreshold, svg, gNodeRef, setHoveredNode, setInactiveNodes, refConteiner) => {
  const margin = { top: 40, right: 40, bottom: 40, left: 40 },
    width = refConteiner.current.offsetWidth - margin.right - margin.left,
    height = 600 - margin.top - margin.bottom;

  // Create the SVG container, a layer for the links and a layer for the nodes.
  d3
    .select(svg.current)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  svg = d3.select(svg.current);

  // Traverse the tree and get the values of the child nodes that are leaves.
  const leaf = traverseTree(data);

  // Set the domain for the color scale.
  const color = d3
    .scaleSequential(d3.interpolateYlOrBr)
    .domain([d3.max(leaf), 0]);

  const root = d3.hierarchy(data);
  const dy = height / root.height; // Fit vertically
  const leaves = root.leaves();
  let allPopShareValues = [];

  leaves.forEach((leave) => {
    allPopShareValues.push(leave.data.info.Pop_Share);
  });
  //the radio of the nodes need to related with with of the father conteiner;
  let maxSizeNode = ((width - (margin.right + margin.left)) / leaves.length) / 2;
  //when there are few nodes the nodes become very large
  if (maxSizeNode > 40) {
    maxSizeNode = 28;
  }

  const minSizeNode = 1;
  const generatorSizeNode = d3
    .scaleSqrt()
    .domain([0, d3.max(allPopShareValues)])
    .range([minSizeNode, maxSizeNode]);

  // Define the tree layout and the shape for links.
  const tree = d3.tree().size([width + (margin.right + margin.left), (height - (margin.top + margin.bottom))]);
  const diagonal = d3
    .linkVertical()
    .x((d) => d.x)
    .y((d) => d.y);

  gLinkRef.current = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)

  gNodeRef.current = svg
    .append("g")
    .attr("cursor", "pointer")
    .attr("pointer-events", "all")

  function update(event, source, duration = 500) {
    const nodes = root.descendants().reverse();

    // Compute the new tree layout.
    tree(root);

    const transition = svg
      .transition()
      .duration(duration)
      .tween(
        "resize",
        window.ResizeObserver ? null : () => () => svg.dispatch("toggle")
      );


    // Filter leafNodes that ha pop share
    const leafNodes = nodes.filter(d => d?.data?.info?.Pop_Share !== undefined);
    const leafCount = leafNodes.length;
    let minRelativeMean = 0;
    let maxRelativeMean = 0;
    let allRelativeMeann = [];

    leafNodes.forEach((d) => {
      if (d?.data?.info?.Relative_Type_Mean) {
        allRelativeMeann.push(d?.data?.info?.Relative_Type_Mean)
      }
    });

    minRelativeMean = Math.min(...allRelativeMeann);
    maxRelativeMean = Math.max(...allRelativeMeann);

    const yScale = d3.scaleLinear()
      .domain([minRelativeMean, (maxRelativeMean + 5.5)])
      .range([height, margin.top])

    const yScaleEje = d3.scaleLinear()
      .domain([minRelativeMean, (maxRelativeMean + 5.5)])
      .range([height + margin.bottom, margin.top])

    // adaptative from size of tree
    const treeWidth = width - margin.left - margin.right;

    if (!showBubble) {
      const yAxis = d3.axisLeft(yScaleEje)

      svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(yAxis)

    }

    nodesGenerator(showBubble, nodesThreshold, setHoveredNode, setInactiveNodes, nodes, source, gNodeRef, margin, update, setTooltip, color, transition, generatorSizeNode, yScale, width);
    const { link, linkEnter } = linksGenerator(root, gLinkRef, margin, source, diagonal, setTooltip, showBubble, yScale);

    //new function transitions
    transitionsSetUp(link, linkEnter, diagonal, transition, source, root, yScale, margin, showBubble);

  }

  // Do the first update to the initial configuration of the tree — where a number of nodes
  // are open (arbitrarily selected as the root, plus nodes with 7 letters).
  root.x0 = dy / 2;
  root.y0 = 0;
  root.descendants().forEach((d, i) => {
    d.id = i;
    d._children = d.children;
    //if (d.depth) d.children = null;
    if (inactiveNodes.includes(d.data.id)) d.children = null;
  });

  update(null, root, 0);
}

const tooltipGenerator = (setTooltip, gNodeRef, hoveredNode, tooltip) => {
  if (gNodeRef.current) {
    const node = gNodeRef.current.select(".hovered");
    if (!node.empty()) {
      const nodeClass = node.attr("class");
      node.attr("class", nodeClass.replace("hovered", ""));
      setTooltip({ content: null, position: { x: 0, y: 0 } });
    }
  }
  if (gNodeRef.current && hoveredNode) {
    const node = gNodeRef.current.select(`.${hoveredNode}`);
    if (!node.empty()) {
      node.attr("class", `node ${hoveredNode} hovered`);

      const coordinates = node.node().getBoundingClientRect();
      const content = Object.entries(node.data()[0].data.info)
        .filter(([key, value]) => (key !== "Box_Number" ? true : false))
        .map(([key, value]) => {
          return (
            <p key={key}>
              <b>{ExtendedVarNames[key]}:</b> {value}
            </p>
          );
        });

      if (!tooltip.content)
        setTooltip({
          content: content,
          position: { x: coordinates.x + 10, y: coordinates.y + 10 },
        });
    }
  }
}

function TreeGraph() {
  const { visualization, showBubble } = useContext(VisualizationContext);
  const { filterOptions, filters } = useContext(FilterContext);
  const { hoveredNode, setHoveredNode, inactiveNodes, setInactiveNodes } = useContext(HoverHodesContext);
  const ref = useRef();
  const refConteiner = useRef();
  const gNodeRef = useRef();
  const gLinkRef = useRef();
  const nodesThreshold = 30;

  const [tooltip, setTooltip] = useState({
    content: null,
    position: { x: 0, y: 0 },
  });

  useEffect(() => {
    tooltipGenerator(setTooltip, gNodeRef, hoveredNode, tooltip)
  }, [gNodeRef, hoveredNode]);



  useEffect(() => {
    if (
      !filterOptions.country ||
      !Array.isArray(filterOptions.country) ||
      filterOptions.country.length === 0 ||
      !filters.country ||
      !filters.year
    ) {
      console.log("Data or filters are incomplete.");
      return;
    }

    const type = visualization === "ante" ? "ex-ante" : "ex-post";
    const country = filterOptions.country.find(
      (country) => country.value === filters.country
    ).value;


    d3.json(
      `/data/${type}/tree/${country}_${filters.year}_${type.replace("-", "")}.json`
    )
      .then((data) => {
        printPlot(data, setTooltip, inactiveNodes, gLinkRef, showBubble, nodesThreshold, ref, gNodeRef, setHoveredNode, setInactiveNodes, refConteiner);
      })
      .catch((error) => {
        console.error("Error loading data:", error);
      });

    return () => {
      d3.select(ref.current).selectAll("*").remove();
    };
  }, [filterOptions.country, filters, visualization, showBubble]);

  return (
    <div ref={refConteiner}>
      <svg ref={ref}></svg>
      <Tooltip content={tooltip.content} position={tooltip.position} />
    </div>
  );
}

export default TreeGraph;
