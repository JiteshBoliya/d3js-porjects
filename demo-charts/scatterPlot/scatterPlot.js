width = 1000;
height = 600;
margin = { top: 20, left: 50, bottom: 20, right: 20 };

// Created svg
let svg = d3
  .select("#scatterPlot")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

// Fetch data
d3.csv(
  "https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/2_TwoNum.csv"
).then((data) => {
  // Set x axis
  let x = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => parseInt(d.GrLivArea)))
    .range([0, width]);

  // Apply x axis
  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // Set y axis
  let y = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => parseInt(d.SalePrice)))
    .range([height, 0]);

  // Apply y axis
  svg.append("g").attr("transform", "translate(0,0)").call(d3.axisLeft(y));

  // Show data acording to the x and y axis as scattered format
  svg
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => x(d.GrLivArea))
    .attr("cy", (d) => y(d.SalePrice))
    .attr("r", 5)
    .style("fill", "blue")
    .style("opacity", 0.5);
});
