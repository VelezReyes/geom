
# Legacy

## About

Project based on GEOM research [website](https://github.com/PedroToL/GEOM)

## Data

### Final

```
name,iso,y,c,Circumstances,latest,var,Region,Approach1,Value,Measure,Approach,Perspective
```

### Filtered Final

```
iso,Value,name
```

## Pages
* App
* Index (Deprecated)
* About (Deprecated)
* Documentation (Deprecated)
* Global (Deprecated)
* Table (Deprecated)
* Country (Deprecated)

```py
def display_page(path):
    if path == "/":
        return index.layout
    if path == "/_about":
        return _about.layout
    if path == "/documentation":
        return documentation.layout
    if path == "/global":
        return _global.layout
    if path == "/_table":
        return _table.layout
    if path == "/country":
        return country.layout
```

## App

This page is based on [Our World In Data](https://ourworldindata.org/gender-ratio) and attempts to replicate the UX for the given datasets.


### Index

Data:
```py
df = pd.read_csv("./data/Processed/final.csv")

df_map = df[df["Circumstances"] == "all"].copy()
df_map = df_map[df_map["latest"] == 1].copy()
df_map = df_map[df_map["Perspective"] == 'Ex-Ante Random Forest'].copy()
df_map = df_map[df_map["Measure"] == 'Gini'].copy()
df_map = df_map[df_map["Approach"] == 'Absolute'].copy()
```

Graph:
Choropleth based on `df_map` (static data)

```py
fig_map = px.choropleth(df_map, locations="iso", color="Value", hover_name="name")

fig_map.update_layout(
      geo=dict(
        showframe=False,
        showcoastlines=False,
        showland=True, 
        landcolor="lightgray",
        projection_type='equirectangular'
      ),
      showlegend=False,  # Hide legend
      margin=dict(
        l=0,  # left margin
        r=0,  # right margin
        b=25,  # bottom margin
        t=25   # top margin
    )
  )

fig_map.update_geos(projection_scale=1.05, center={"lat": 20, "lon": 0}, scope="world")
```

Data processing options for the `df_map` used by the choropleth (Under a bad network Slow 3G both methods take this time for loading):
1. process `final.csv` (~2MB) on the fly and then use it as input for d3 (~2115.80 ms)
2. pre-process `final.csv` (~1KB) in static `filtered-final.csv` and use it as input for d3 (~42625.60 ms)

### Global

Data:
```py
df = pd.read_csv("./data/Processed/final.csv")
```
And filtered based on Measure, Perspective, Approach, Variable

Graphs:
* choropleth
* time series / scatter plot

### Table

### Global

This page contains the dashboard sidebar with initial world view, table and time series

### Country
