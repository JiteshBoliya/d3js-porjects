let margin = { top: 10, right: 10, bottom: 10, left: 10 };

let config = {
  chartSize: 700,
  innerRadius: 150,
  outerRadius: 0.4,
  chartYBarText:{
    value: "Population",
    size: 20,
    color: "blue"
  }
}

let width = (config.chartSize) - margin.left - margin.right;
let height = width - margin.top - margin.bottom;

let innerRadius = (config.innerRadius);
let outerRadius = Math.min(width, height) * (config.outerRadius);           ;

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

let colorScale = d3
  .scaleOrdinal()
  .domain([
    "Under 5 Years",
    "5 to 13 Years",
    "14 to 17 Years",
    "18 to 24 Years",
    "25 to 44 Years",
    "45 to 64 Years",
    "65 Years and Over",
  ])
  .range(colorPalette);

let svg = d3
  .select("#radialStack")
  .append("svg")
  .attr(
    "style",
    "width: 100%; height: auto; font: 10px sans-serif;background-color: white"
  )
  .attr("viewBox", [-width / 2, -height / 2, width, height])
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv("../../demo-data/data-2.csv").then((arcData) => {
  let stackedSeries = d3
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
  let series = stackedSeries(arcData);

  // An angular x-scale
  let x = d3
    .scaleBand()
    .domain(arcData.map((d) => d.State))
    .range([0, 2 * Math.PI])
    .align(0);

  // A radial y-scale maintains area proportionality of radial bars
  let y = d3
    .scaleRadial()
    .domain([0, d3.max(series, (d) => d3.max(d, (d) => d[1]))])
    .range([innerRadius, outerRadius]);

  // x axis
  svg
    .append("g")
    .attr("text-anchor", "middle")
    .selectAll()
    .data(x.domain())
    .join("g")
    .attr(
      "transform",
      (d) =>
        `rotate(${
          ((x(d) + x.bandwidth() / 2) * 180) / Math.PI - 90
        }) translate(${innerRadius},0)`
    )
    .call((g) => g.append("line").attr("x2", -5).attr("stroke", "#000")) // for tick on x bar
    .call((g) =>
      g
        .append("text")
        .attr("transform", (d) =>
          (x(d) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI  // This logic for lables of x bar in circle
            ? "rotate(90)translate(0,16)"
            : "rotate(-90)translate(0,-9)"
        )
        .text((d) => d)
    );

  // y axis
  svg
    .append("g")
    .attr("text-anchor", "middle")
    .call((g) =>
      g
        .append("text")
        .attr("y", (d) => -y(y.ticks(5).pop()))
        .attr("dy", "-2em")
        .text(config.chartYBarText.value)
        .style('font-size', (config.chartYBarText.size))
        .style("fill", (config.chartYBarText.color))
    )
    .call((g) =>
      g
        .selectAll("g")
        .data(y.ticks(5).slice(1))
        .join("g")
        .attr("fill", "none")
        .call((g) =>
          g
            .append("circle")
            .attr("stroke", "#000")
            .attr("stroke-opacity", 0.5)
            .attr("r", y)
        )
        .call((g) =>
          g
            .append("text")
            .attr("y", (d) => -y(d))
            .attr("dy", "0.35em")
            .attr("stroke", "#fff")
            .attr("stroke-width", 5)
            .text(y.tickFormat(5, "s"))
            .clone(true)
            .attr("fill", "#000")
            .attr("stroke", "none")
        )
    );

  let arc = d3
    .arc()
    .innerRadius((d) => y(d[0]))
    .outerRadius((d) => y(d[1]))
    .startAngle((d) => x(d.data.State))
    .endAngle((d) => x(d.data.State) + x.bandwidth())
    .padAngle(1.5 / innerRadius)
    .padRadius(innerRadius);

  // A group for each series, and a rect for each element in the series
  svg
    .append("g")
    .selectAll()
    .data(series)
    .join("g")
    .attr("fill", (d) => colorScale(d.key))
    .selectAll("path")
    .data((D) => D.map((d) => ((d.key = D.key), d)))
    .join("path")
    .attr("d", arc)
    .append("title")
    .text(
      (d) =>
        `State : ${d.data.State}\nAge : ${d.key} \nPopulation : ${
          d.data[d.key]
        }\n`
    );
});
