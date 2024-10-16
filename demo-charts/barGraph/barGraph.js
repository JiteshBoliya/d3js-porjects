// width = 1000;
// height = 600;

let margin = { top: 10, right: 10, bottom: 10, left: 10 };
let width = document.body.clientWidth - margin.left - margin.right;
let height = 600 - margin.top - margin.bottom;

let svg = d3
  .select("#barGraph")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv("../../demo-data/bardata.csv").then((data) => {
  let x = d3
    .scaleBand()
    .domain(bandData(data))
    .range([0, width - margin.right -margin.left])
    .paddingInner(0.25)
    .paddingOuter(0.25)

  svg
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + (height-margin.top) + ")")
    .call(d3.axisBottom(x).tickSize(10));

  let y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => parseInt(d.value))])
    .range([height -margin.top, 0])

  svg
    .append("g")
    .attr("transform", "translate(" + margin.left + ",0)")
    .call(d3.axisLeft(y));

  let bar = svg
    .selectAll("bar")
    .data(data)
    .join((enter) => enter.append("rect"))
    .attr("transform", "translate(" + margin.left + ",0)")
    .attr("x", (d) => x(parseInt(d.year)))
    .attr("y", (d) => y(d.value))
    .attr("height", (d) => (height - y(d.value)) -margin.top)
    .attr("width", x.bandwidth)
    .style("fill", "blue")
    .style("opacity", 0.5);
});

let bandData = (d) => {
  return d.map((e) => parseInt(e.year));
};
