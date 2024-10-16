let margin = {
  top: 10,
  right: 10,
  bottom: 50,
  left: 70,
};

let lableConfig = {
  text: {
    xAxis: "States",
    yAxis: "Population",
  },
  size: 10,
  color: "steelblue",
  fontWeight: "bolder",
};

let axisConfig = {
  size: 10,
  color: "#084081",
};

let colorPalette = [
  // color palette1
    // "#ccebc5",
    // "#a8ddb5",
    // "#7bccc4",
    // "#4eb3d3",
    // "#2b8cbe",
    // "#0868ac",
    // "#084081",

  // color palette2
  "#242acf",
  "#493fcc",
  "#6d54c9",
  "#9269c6",
  "#b67ec3",
  "#db93c0",
  "#ffa8bd",

];

let width = document.body.clientWidth - margin.left - margin.right;
let height = 540 - margin.top - margin.bottom;

var svg = d3
  .select("#stackedbar")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv("../../demo-data/data.csv").then((data) => {
  // x axis
  let x = d3
    .scaleBand()
    .domain(data.map((d) => d.State))
    .range([0, width])
    .paddingInner(0.1)
    .paddingOuter(0.5);

  let xAxis = svg
    .append("g")
    .attr("transform", "translate(0," + (height - margin.top) + ")")
    .style("font-size", axisConfig.size)
    .style("color", axisConfig.color)
    .call(d3.axisBottom(x));

  xAxis
    .select("g")
    .append("text")
    .attr("fill", "black")
    .text(lableConfig.text.xAxis)
    .attr("x", innerWidth / 2)
    .attr("y", 50)
    .style("font-size", lableConfig.size)
    .style("fill", lableConfig.color)
    .style("font-weight", lableConfig.fontWeight);

  //  y axis
  let y = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => totalPopulation(d)))
    .range([height - margin.top, 0])
    .nice();

  let yAxis = svg
    .append("g")
    .style("font-size", axisConfig.size)
    .style("color", axisConfig.color)
    .call(d3.axisLeft(y).tickFormat(d3.format(".2s")).tickSize(-width));

  yAxis
    .select("g")
    .append("text")
    .attr("fill", "black")
    .text(lableConfig.text.yAxis)
    .attr("transform", "rotate(-90)")
    .attr("x", height / 2)
    .attr("y", -50)
    .style("font-size", lableConfig.size)
    .style("fill", lableConfig.color)
    .style("font-weight", lableConfig.fontWeight);

  // bar chart
  const stackedSeries = d3
    .stack()
    .keys([
      "Under 5 Years",
      "5 to 13 Years",
      "14 to 17 Years",
      "18 to 24 Years",
      "25 to 44 Years",
      "45 to 64 Years",
      "65 Years and Over",
    ]);

  let series = stackedSeries(data);

  let colorScale = d3.scaleOrdinal().range(colorPalette);

  svg
    .append("g")
    .selectAll("g")
    .data(series)
    .join("g")
    .attr("fill", (d) => colorScale(d.key))
    .selectAll("rect")
    .data((D) => D.map((d) => ((d.key = D.key), d)))
    .join("rect")
    .attr("x", (d) => x(d.data["State"]))
    .attr("y", (d) => y(d[1]))
    .attr("height", (d) => y(d[0]) - y(d[1]))
    .attr("width", x.bandwidth()).append("title")
    .text(
      (d) =>
        `State : ${d.data.State}\nAge : ${d.key} \nPopulation : ${
          d.data[d.key]
        }\n`
    );


});


let totalPopulation = (d) => {
  return (
    parseInt(d["Under 5 Years"]) +
    parseInt(d["5 to 13 Years"]) +
    parseInt(d["14 to 17 Years"]) +
    parseInt(d["18 to 24 Years"]) +
    parseInt(d["25 to 44 Years"]) +
    parseInt(d["45 to 64 Years"]) +
    parseInt(d["65 Years and Over"])
  );
};
