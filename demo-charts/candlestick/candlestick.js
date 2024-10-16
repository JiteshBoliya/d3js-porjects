width = 928;
height = 600;
margin = {
  top: 20,
  bottom: 30,
  left: 40,
  right: 30,
};

d3.csv("../../demo-data/FTSE.csv").then((data) => {
  data.forEach((d) => {
    d.Date = new Date(d.Date);
  });

  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.Date))
    .range([margin.left, width - margin.right])
    .padding(0.7)
    .paddingInner(1);

  const y = d3
    .scaleLog()
    .domain([d3.min(data, (d) => d.Low), d3.max(data, (d) => d.High)])
    .rangeRound([height - margin.bottom, margin.top]);

  const svg = d3
    .select("#candlestick")
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(
      d3
        .axisBottom(x)
        .tickValues(
          d3.utcMonday
            .every(width > 720 ? 1 : 2)
            .range(data.at(0).Date, data.at(-1).Date)
        )
        .tickFormat(d3.utcFormat("%-m/%-d"))
    )
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-2.5em")
    .attr("dy", "-0.8em")
    .attr("style", "font-size: 5")
    .attr("transform", "rotate(-60)")
    .call((g) => g.select(".domain").remove());

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(
      d3
        .axisLeft(y)
        .tickFormat(d3.format("$~f"))
        .tickValues(d3.scaleLinear().domain(y.domain()).ticks())
    )
    .call((d) =>
      d
        .selectAll(".tick line")
        .clone()
        .attr("stroke-opacity", 0.2)
        .attr("x2", width - margin.left - margin.right)
    )
    .call((d) => d.select(".domain").remove());

  const g = svg
    .append("g")
    .attr("stroke-linecap", "round")
    .attr("stroke", "black")
    .selectAll("g")
    .data(data)
    .join("g")
    .attr("transform", (d) => `translate(${x(d.Date)},0)`);

  g.append("line")
    .attr("y1", (d) => y(d.Low))
    .attr("y2", (d) => y(d.High));

  g.append("line")
    .attr("y1", (d) => y(d.Open))
    .attr("y2", (d) => y(d.Close))
    .attr("stroke-width", 4)
    .attr("stroke", (d) =>
      d.Open > d.Close
        ? d3.schemeSet1[0]
        : d.Close > d.Open
        ? d3.schemeSet1[2]
        : d3.schemeSet1[8]
    );

  const formatDate = d3.utcFormat("%B %-d, %Y");
  const formatValue = d3.format(".2f");
  const formatChange = (
    (f) => (y0, y1) =>
      f((y1 - y0) / y0)
  )(d3.format("+.2%"));

  g.append("title").text(
    (d) => `${formatDate(d.Date)}
Open: ${formatValue(d.Open)}
Close: ${formatValue(d.Close)} (${formatChange(d.Open, d.Close)})
Low: ${formatValue(d.Low)}
High: ${formatValue(d.High)}`
  );
});
