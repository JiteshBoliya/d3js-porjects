const width = 975;
const height = 610;

d3.csv("../../demo-data/airports.csv").then((airportsData) => {
  d3.json("../../demo-data/states-albers-10m.json").then((statesData) => {
    const svg = d3
      .select("#voronoi")
      .append("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width:100%;height:auto");

    // Project the voronois on the map
    const projection = d3.geoAlbers().scale(1300).translate([487.5, 305]);

    // Set the longitude and latitude positive value
    airportsData = airportsData.map((d) => ({
      type: "Feature",
      properties: d,
      geometry: {
        type: "Point",
        coordinates: [+d.longitude, +d.latitude],
      },
    }));

    // US map
    svg
      .append("path")
      .datum(
        topojson.merge(
          statesData,
          statesData.objects.states.geometries.filter(
            (d) => d.id !== "02" && d.id !== "15"
          )
        )
      )
      .attr("fill", "#ddd")
      .attr("d", d3.geoPath());

    // Border of each state of US
    svg
      .append("path")
      .datum(
        topojson.mesh(statesData, statesData.objects.states, (a, b) => a !== b)
      )
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-linejoin", "round")
      .attr("d", d3.geoPath());

    //  Voronois red line
    svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("pointer-events", "all")
      .selectAll("path")
      .data(d3.geoVoronoi().polygons(airportsData).features)
      .join("path")
      .attr("d", d3.geoPath(projection))
      .append("title")
      .text((d) => {
        const p = d.properties.site.properties;
        return `${p.name} Airport\nCity: ${p.city}\nState: ${p.state}`;
      });

    // Voronois points
    svg
      .append("path")
      .datum({ type: "FeatureCollection", features: airportsData })
      .attr("d", d3.geoPath(projection).pointRadius(1.5));
  });
});
