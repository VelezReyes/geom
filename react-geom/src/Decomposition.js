import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

import Tooltip from "./Tooltip";
import "./ExAnteDecomposition.css";

const barPlotColors = {
  Ethnicity: "#3498db", // Cyan
  Sex: "#e74c3c", // Orange
  Father_Occ: "#f1c40f", // Green
  Mother_Occ: "#34495e", // Blue
  Father_Edu: "#2ecc71", // Red
  Mother_Edu: "#9b59b6", // Purple
  Birth_Area: "#e67e22", // Brown
};

const ExtendedVarNames = {
  Ethnicity: "Ethnicity",
  Sex: "Sex",
  Father_Occ: "Father Occupation",
  Father_Edu: "Father Education",
  Mother_Occ: "Mother Occupation",
  Mother_Edu: "Mother Education",
  Birth_Area: "Birth Area",
};

function ExAnteDecomposition({ data, filters, visualization }) {
  const ref = useRef();
  const [tooltip, setTooltip] = useState({
    content: null,
    position: { x: 0, y: 0 },
  });

  useEffect(() => {
    if (!data || Object.values(filters).some((value) => value === undefined)) {
      console.log("Data or filters are incomplete.");
      return;
    }

    const type = visualization === "ante" ? "ex-ante" : "ex-post";
    const country = data.find(
      (country) => country.value === filters.country
    ).value;
    const year = filters.year;

    const margin = { top: 20, right: 30, bottom: 70, left: 150 };
    const width = 1200 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = d3.select(ref.current);

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    d3.csv(
      `/data/${type}/decomposition/decomposition_${country}_${year}_${type.replace(
        "-",
        ""
      )}.csv`
    )
      .then((data) => {
        const transformedObject = data.reduce((acc, obj) => {
          if (obj.exante) {
            acc[obj.Circumstances] = +obj.exante;
          } else if (obj.expost) {
            acc[obj.Circumstances] = +obj.expost;
          }

          return acc;
        }, {});

        // Add X axis
        const x = d3
          .scaleLinear()
          .domain([0, Math.max(...Object.values(transformedObject))])
          .range([0, width]);

        g.append("g")
          .attr("class", "axisBottom") // Add class to the axis
          .attr("transform", `translate(0, ${height})`)
          .call(d3.axisBottom(x).tickSize(-height).ticks(10))
          .selectAll("text")
          .attr("transform", "translate(-10,0)rotate(-45)")
          .style("text-anchor", "end");

        // Add opacity to the tick lines of axisBottom
        g.selectAll(".axisBottom .tick line").attr("opacity", 0.1);

        // Add Y axis
        const y = d3
          .scaleBand()
          .range([0, height])
          .domain(
            Object.keys(transformedObject).map((key) => ExtendedVarNames[key])
          )
          .padding(0.1);

        g.append("g").call(d3.axisLeft(y));

        // Add X axis label:
        g.append("text")
          .attr("text-anchor", "end")
          .attr("x", width)
          .attr("y", height + margin.top + 40)
          .style("font-weight", "bold")
          .text("Percentage Share");

        // Bars
        g.selectAll("myRect")
          .data(Object.entries(transformedObject))
          .join("rect")
          .attr("x", x(0))
          .attr("y", (d) => y(ExtendedVarNames[d[0]]))
          .attr("width", (d) => x(d[1]))
          .attr("height", y.bandwidth())
          .attr("fill", (d) => barPlotColors[d[0]])
          .attr("stroke", "black")
          .attr("stroke-width", "0")
          .on("mouseover", function (event, datum) {
            setTooltip({
              content: `${ExtendedVarNames[datum[0]]}: ${datum[1].toFixed(2)}`,
              position: { x: event.pageX + 10, y: event.pageY + 10 },
            });
          })
          .on("mousemove", function (event, datum) {
            setTooltip({
              content: `${ExtendedVarNames[datum[0]]}: ${datum[1].toFixed(2)}`,
              position: { x: event.pageX + 10, y: event.pageY + 10 },
            });
          })
          .on("mouseout", function () {
            setTooltip({ content: null, position: { x: 0, y: 0 } });
          });
      })
      .catch((error) => {
        console.error("Error loading the data: ", error);
      });

    // Cleanup function
    return () => {
      svg.selectAll("*").remove();
    };
  }, [data, filters, visualization]);

  return (
    <>
      <svg ref={ref}></svg>
      <Tooltip content={tooltip.content} position={tooltip.position} />
    </>
  );
}

export default ExAnteDecomposition;
