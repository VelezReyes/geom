import React, { useRef, useState, useEffect, useContext } from "react";
import { FilterContext } from "./contexts/Filter.context";
import { HoverHodesContext } from "./contexts/TreeBubble.context";
import { VisualizationContext } from "./contexts/Visualization.context";
import useHoverNodes from "./hooks/useHoverNodes";
import * as d3 from "d3";
import { legendColor } from "d3-svg-legend";

import Tooltip from "./Tooltip";
import "./BubblePlot.css";

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

function BubblePlot() {
  const { visualization } = useContext(VisualizationContext);
  const { filterOptions, filters } = useContext(FilterContext);
  const { hoveredNode, setHoveredNode, inactiveNodes } = useContext(HoverHodesContext);
  const ref = useRef();
  const gDotsRef = useRef();

  const [tooltip, setTooltip] = useState({
    content: null,
    position: { x: 0, y: 0 },
  });

  useEffect(() => {
    if (gDotsRef.current) {
      const circle = gDotsRef.current.select(".hovered");
      if (!circle.empty()) {
        const circleClass = circle.attr("class");
        circle.attr("class", circleClass.replace("hovered", ""));
        setTooltip({ content: null, position: { x: 0, y: 0 } });
      }
    }
    if (gDotsRef.current && hoveredNode) {
      const circle = gDotsRef.current.select(`.${hoveredNode}`);
      if (!circle.empty()) {
        const circleClass = circle.attr("class");

        const coordinates = circle.node().getBoundingClientRect();
        const content = Object.entries(circle.data()[0]).map(([key, value]) => {
          if (
            key === "Country_Code" ||
            key === "Year" ||
            key === "Type" ||
            key === "Box_Number" ||
            value === ""
          ) {
            return null;
          }
          const keyVal = ExtendedVarNames[key] || key;
          const values = value.replace(",", ", ");
          return (
            <div key={key} className="type-description">
              <ul>
                <li key={keyVal}>
                  <b>{keyVal}:</b> {values}
                </li>
              </ul>
            </div>
          );
        });

        if (!tooltip.content)
          setTooltip({
            content: content,
            position: { x: coordinates.x + 15, y: coordinates.y + 15 },
          });

        if (!circleClass.includes("inactive"))
          circle.attr("class", `bubbles ${hoveredNode} hovered`);
      }
    }
  }, [hoveredNode, gDotsRef]);

  useEffect(() => {
    if (gDotsRef.current && inactiveNodes) {
      const circles = gDotsRef.current.selectAll(".inactive");
      if (circles)
        circles.attr("class", (d) => {
          return `bubbles node-${d.Box_Number}`;
        });

      inactiveNodes.forEach((node) => {
        const circle = gDotsRef.current.select(`.node-${node}`);
        if (circle) circle.attr("class", `bubbles node-${node} inactive`);
      });
    }
  }, [inactiveNodes, gDotsRef]);

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
    const year = filters.year;

    // set the dimensions and margins of the graph
    const margin = { top: 40, right: 50, bottom: 40, left: 50 },
      width = 600 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom;
    
    const svg = d3
      .select(ref.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const g = svg
      .append("g")
      .attr("width", width)
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    d3.csv(
      `/data/${type}/bubble-plot/${country}_${year}_${type.replace(
        "-",
        ""
      )}.csv`
    )
      .then((data) => {
        const max_x = d3.max(data, (d) => +d.Relative_Type_Mean);
        const max_y = d3.max(data, (d) => +d.Pop_Share);

        // Add X axis
        const x = d3.scaleLinear().domain([0, max_x]).nice().range([0, width]);
        g.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(
            d3
              .axisBottom(x)
              .tickSize(-height * 1.3)
              .ticks(10)
          )
          .select(".domain")
          .remove();

        // Add Y axis
        const y = d3
          .scaleLinear()
          .domain([0, max_y + 1])
          .range([height, 0])
          .nice();
        g.append("g")
          .call(
            d3
              .axisLeft(y)
              .tickSize(-width * 1.1)
              .ticks(7)
          )
          .select(".domain")
          .remove();

        // Customization
        g.selectAll(".tick line").attr("stroke", "#EBEBEB");

        // Add X axis label:
        g.append("text")
          .attr("text-anchor", "end")
          .attr("x", width + margin.right)
          .attr("y", height + margin.bottom / 1.2)
          .text("Relative Type Mean");

        // Y axis label:
        g.append("text")
          .attr("text-anchor", "end")
          .attr("transform", "rotate(-90)")
          .attr("y", -margin.left + 20)
          .attr("x", 0)
          .text("Population Share (%)");

        // Add a scale for bubble size
        const z = d3
          .scaleSqrt()
          .domain([0, max_y])
          .range([1, Math.min(width, height) / 20]); // Adjust range as needed for better visualization

        // Add a scale for bubble color
        const color = d3
          .scaleSequential(d3.interpolateYlOrBr)
          .domain([max_x, 0]);

        g.append("g")
          .attr("class", "legendSequential")
          .attr("transform", `translate(${width}, ${0})`);

        const legendSequential = legendColor()
          .shapeWidth(20)
          .cells(10)
          .orient("vertical")
          .scale(color);

        g.select(".legendSequential").call(legendSequential);

        // Add dots
        gDotsRef.current = g.append("g");

        gDotsRef.current
          .selectAll("dot")
          .data(data)
          .enter()
          .append("circle")
          .attr("class", (d) => {
            return `bubbles node-${d.Box_Number}`;
          })
          .attr("cx", function (d) {
            return x(d.Relative_Type_Mean);
          })
          .attr("cy", function (d) {
            return y(+d.Pop_Share);
          })
          .attr("r", function (d) {
            return z(+d.Pop_Share);
          })
          .style("fill", (d) => color(+d.Relative_Type_Mean))
          .attr("stroke", "black")
          .on("mouseover", function (event, datum) {
            const content = Object.entries(datum).map(([key, value]) => {
              if (
                key === "Country_Code" ||
                key === "Year" ||
                key === "Type" ||
                key === "Box_Number" ||
                value === ""
              ) {
                return null;
              }
              const keyVal = ExtendedVarNames[key] || key;
              const values = value.replace(",", ", ");
              return (
                <div key={key} className="type-description">
                  <ul>
                    <li key={keyVal}>
                      <b>{keyVal}:</b> {values}
                    </li>
                  </ul>
                </div>
              );
            });

            setHoveredNode(`node-${datum.Box_Number}`);
            setTooltip({
              content: content,
              position: { x: event.pageX + 10, y: event.pageY + 10 },
            });
          })
          .on("mousemove", function (event, datum) {
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

        // Add Vertical line at point 1.0
        g.append("line")
          .attr("x1", x(1.0))
          .attr("y1", 0)
          .attr("x2", x(1.0))
          .attr("y2", height)
          .attr("stroke", "#FF0000") // Brighter red color
          .attr("stroke-width", 2) // Increase the stroke width
          .attr("stroke-dasharray", "4");
      })
      .catch((error) => {
        console.error("Error loading the data: ", error);
      });

    // Cleanup function
    return () => {
      svg.selectAll("*").remove();
    };
  }, [filterOptions.country, filters, visualization]);

  return (
    <div>
      <svg ref={ref}></svg>
      <Tooltip content={tooltip.content} position={tooltip.position} />
    </div>
  );
}

export default BubblePlot;
