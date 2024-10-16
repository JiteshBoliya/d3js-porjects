const width = document.body.clientWidth/2;
const height = width;
// const height = Math.min(width, 500); We can use Math.min for apply min size of the graph

const radius = width / 2;

const arc = d3
  .arc()
  .innerRadius(radius * 0.67)
  .outerRadius(radius - 1);

const svg = d3
  .select("#donutChart")
  .append("svg")
  .attr("height", height)
  .attr("width", width)
  .attr("viewBox", [-width / 2, -height / 2, width, height])
  .attr("style", "max-width:100%; height:auto");

d3.csv("../../demo-data/population-by-age.csv").then((data) => {
  const pie = d3
    .pie()
    .padAngle(1 / radius)
    .sort(null)
    .value((d) => d.value);

  const color = d3
    .scaleOrdinal()
    .domain(data.map((d) => d.name))
    .range(
      d3
        .quantize((t) => d3.interpolateSpectral(t * 0.8 + 0.1), data.length)
        .reverse()
    );

  svg
    .append("g")
    .selectAll()
    .data(pie(data))
    .join("path")
    .attr("fill", (d) => color(d.data.name))
    .attr("d", arc)
    // .append("title")
    // .text((d) => `${d.data.name}: ${d.data.value}`);

  svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .attr("text-anchor", "middle")
    .selectAll()
    .data(pie(data))
    .join("text")
    .attr("transform", (d) => `translate(${arc.centroid(d)})`)
    .call((text) =>
      text
        .append("tspan")
        .attr("y", "-0.4em")
        .attr("font-weight", "bold")
        .text((d) => d.data.name)
    )
    .call((text) =>
      text
        .filter((d) => d.endAngle - d.startAngle > 0.25)
        .append("tspan")
        .attr("x", 0)
        .attr("y", "0.7em")
        .attr("fill-opacity", 0.7)
        .text((d) => d.data.value.toLocaleString("en-US"))
    );
});
