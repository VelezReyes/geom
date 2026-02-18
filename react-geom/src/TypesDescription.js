import React, { useEffect, useState } from "react";
import * as d3 from "d3";

import "./TypesDescription.css";

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

function TypesDescription({ filters }) {
  const [typesDescription, setTypesDescription] = useState({});
  const [currentType, setCurrentType] = useState("");

  useEffect(() => {
    if (Object.values(filters).some((value) => value === undefined)) {
      console.log("Data or filters are incomplete.");
      return;
    }

    const country = filters.country;
    const year = filters.year;

    if (country && year) {
      d3.csv(`/data/ex-post/bubble-plot/${country}_${year}_expost.csv`)
        .then((data) => {
          const typesDescription = {};

          data.forEach((row) => {
            const type = row["Box_Number"];
            typesDescription[type] = {};

            Object.keys(row).forEach((key) => {
              if (
                key !== "Type" &&
                key !== "Box_Number" &&
                key !== "Country_Code" &&
                key !== "Year"
              ) {
                typesDescription[type][key] = row[key];
              }
            });
          });

          setTypesDescription(typesDescription);
          setCurrentType(Object.keys(typesDescription)[0]);
        })
        .catch((err) => {
          console.error("Error loading CSV data:", err);
        });
    }
  }, [filters]);

  return (
    <div className="types-description-wrapper">
      <h2>Types Description</h2>
      <div className="selection">
        <select
          value={currentType}
          onChange={(e) => setCurrentType(e.target.value)}
        >
          {Object.keys(typesDescription).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="types-description">
        {Object.entries(typesDescription).map(([type, description]) =>
          type === currentType ? (
            <div key={type} className="type-description">
              <ul>
                {Object.entries(description).map(([key, value]) =>
                  value ? (
                    <li key={key}>
                      <strong>{ExtendedVarNames[key]}:</strong>{" "}
                      {value.replaceAll(",", ", ")}
                    </li>
                  ) : null
                )}
              </ul>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

export default TypesDescription;
