var margin = { top: 70, right: 10, bottom: 50, left: 30 };
let width = document.body.clientWidth - margin.left - margin.right;
let height = 740 - margin.top - margin.bottom;
let colorPalette = [
  "#46000D",
  "#5E0009",
  "#720137",
  "#590054",
  "#42002E",
  "#0D3A32",
  "#224942",
  "#245B47",
  "#223546",
  "#192A3C",
];

var svg = d3
  .select("#racingBar")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .style("background-color", "white");

d3.json("../../demo-data/raceData.json").then((data) => {
  let i = 0;
  let barData = [];

  // Bar color
  let colorScale = d3
    .scaleOrdinal()
    .domain(barData.map((d) => d.visiter_name))
    .range(colorPalette);

  // X axis
  let x = d3.scaleLinear().domain([0, 10]).range([0, width]).nice();
  let xAxis = svg
    .append("g")
    .attr("class", "xAxis")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(d3.axisTop(x).tickSize(-height));

  // x axis lable
  xAxis
    .select("g")
    .append("text")
    .attr("fill", "black")
    .text("Size")
    .attr("x", innerWidth / 2.5)
    .attr("y", -40)
    .style("font-size", 20);

  // Y axis
  let y = d3
    .scaleBand()
    .domain([])
    .range([height, 0])
    .paddingInner(0.2)
    .paddingOuter(0.5);
  svg
    .append("g")
    .attr("class", "yAxis")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(d3.axisLeft(y));

   // Bottom axis 
    let z = d3.scaleLinear().domain([]).range([0, width]);
    svg
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + (height+margin.top) + ")")
    .call(d3.axisBottom(z).tickSize(0));

  // Sort data date wises
  data = data.sort((a, b) => a.date - b.date);

  setInterval(() => {
    // Ittretion upto length of the data
    if (i > data.length) return;

    // Find index if any available data
    let index = barData.findIndex((d) => {
      return d.visiter_name === data[i].visiter_name;
    });

    // ternary operator : used for check is data is new or not -> if yes then pushed else added the new value in old value
    index != -1
      ? (barData[index].size += data[i++].size)
      : barData.push(data[i++]);

    // Update the x axis data
    x.domain([0, d3.max(barData, (d) => d.size)]);
    svg
      .select(".xAxis")
      .transition()
      .duration(1000)
      .call(d3.axisTop(x).tickSize(-height));

    // Update the y axis data
    y.domain(barData.map((d) => d.visiter_name));
    svg
      .select(".yAxis")
      .transition()
      .duration(1000)
      .call(d3.axisLeft(y).tickSize(0));

    // Remove the y axis lables 
    d3.select(".yAxis").selectAll("text").remove();

    // Bars
    svg
      .selectAll("rect")
      .data(barData, (d) => d.visiter_name)
      .join("rect")
      .attr("transform", "translate(0," + margin.top + ")")
      .style("fill", (d) => colorScale(d.visiter_name))
      .attr("x", margin.left)
      .transition(d3.easeLinear())
      .duration(1000)
      .attr("width", (d) => x(d.size))
      .attr("height", 50)
      .attr("x", margin.left)
      .attr("y", (d) => y(d.visiter_name));

    // Lables
    svg
      .selectAll(".label")
      .data(barData, (d) => d.visiter_name)
      .join("text")
      .attr("class", "label")
      .attr("transform", "translate(0," + margin.top + ")")
      .transition(d3.easeLinear())
      .duration(1000)
      .attr("x", margin.left + 10)
      .attr("y", (d) => y(d.visiter_name) + 30)
      .style("fill", "white")
      .style("font-weight", "bold")
      .style(
        "text-shadow",
        "1px 0 black, 0 1px black, 1px 0 black, 0 -1px black"
      )
      .text((d) => d.visiter_name + " - " + d.size);

    sortData(barData);
    timeStempLable(new Date(data[i].date));
  }, 1000);
});

timeStempLable = (fullDate) => {
  // Clear TimeStemp Lable if any
  d3.selectAll("svg g text#timeStampLable").remove();

  // Added TimeStemp Lable
  d3.select("svg")
    .append("g")
    .append("text")
    .attr("id", "timeStampLable")
    .attr("x", width-200)
    .attr("y", height + 100)
    .text((d) => (fullDate + "").slice(0, 25))
    .attr("style", "font-size: 20px");
};

sortData = (barData) => {
  return barData.sort((a, b) => a.size - b.size);
};
