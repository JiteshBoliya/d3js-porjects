d3.csv("../../demo-data/politifact.csv").then((data) => {
  // _______________________________________________________________

  //  data modification
  const categories = {
    "pants-fire": "Pants on fire!",
    "full-flop": "Full flop",
    "false": "False",
    "mostly-false": "Mostly false",
    "barely-true": "Mostly false",
    "half-true": "Half true",
    "mostly-true": "Mostly true",
    "true": "True",
  };

  const rData = data.map((d, i) => {
    return categories[d.ruling]
      ? { name: d.speaker, category: categories[d.ruling], value: +d.count }
      : null;
  });

  d3.rollup(
    rData,
    (group) => {
      const sum = d3.sum(group, (d) => d.value);
      for (const d of group) d.value /= sum;
    },
    (d) => d.name
  );

  data = Object.assign(rData, {
    negative: "← 👺️ More falsehoods ",
    positive: " More truths 😇️ →",
    negatives: ["Pants on fire!","Full flop", "False", "Mostly false"],
    positives: ["Half true", "Mostly true", "True"],
  });

  // __________________________________________________________________________

  // Added signs and bias category

  const signs = new Map(
    [].concat(
      rData.negatives.map((d) => [d, -1]),
      rData.positives.map((d) => [d, +1])
    )
  );

  const bias = d3.sort(
    d3.rollup(
      rData,
      (v) => d3.sum(v, (d) => d.value * Math.min(0, signs.get(d.category))),
      (d) => d.name
    ),
    ([, a]) => a
  );

  // ____________________________________________________________________________

  const margin = {
    top: 40,
    bottom: 0,
    right: 40,
    left: 80,
  };
  const width = 928;
  const height = bias.length * 33 + margin.top + margin.bottom;

  const series = d3
    .stack()
    .keys([].concat(rData.negatives.slice().reverse(), rData.positives))
    .value(
      ([, value], category) => signs.get(category) * (value.get(category) || 0)
    )
    .offset(d3.stackOffsetDiverging)(
    d3.rollup(
      rData,
      (rData) =>
        d3.rollup(
          rData,
          ([d]) => d.value,
          (d) => d.category
        ),
      (d) => d.name
    )
  );

  // __________________________________________________________________________

  const x = d3
    .scaleLinear()
    .domain(d3.extent(series.flat(2)))
    .rangeRound([margin.left, width - margin.right]);

  const y = d3
    .scaleBand()
    .domain(bias.map(([name]) => name))
    .rangeRound([margin.top, height - margin.bottom])
    .padding(2 / 33);

  const color = d3
    .scaleOrdinal()
    .domain([].concat(rData.negatives, rData.positives))
    .range(d3.schemeSpectral[rData.negatives.length + rData.positives.length]);

  const formatValue = (
    (format) => (x) =>
      format(Math.abs(x))
  )(d3.format(".0%"));

  //_____________________________________________________________________________

  const svg = d3
    .select("#DSBChart")
    .append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  svg
    .append("g")
    .selectAll("g")
    .data(series)
    .join("g")
    .attr("fill", (d) => color(d.key))
    .selectAll("rect")
    .data((d) => d.map((v) => Object.assign(v, { key: d.key })))
    .join("rect")
    .attr("x", (d) => x(d[0]))
    .attr("y", ({ data: [name] }) => y(name))
    .attr("width", (d) => x(d[1]) - x(d[0]))
    .attr("height", y.bandwidth())
    .append("title")
    .text(
      ({ key, data: [name, value] }) =>
        `${name} \n${key} : ${formatValue(value.get(key))}`
    );

  svg
    .append("g")
    .attr("transform", `translate(0,${margin.top})`)
    .call(
      d3
        .axisTop(x)
        .ticks(width / 80)
        .tickFormat(formatValue)
        .tickSizeOuter(0)
    )
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .append("text")
        .attr("x", x(0) + 20)
        .attr("y", -24)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text(data.positive)
    )
    .call((g) =>
      g
        .append("text")
        .attr("x", x(0) - 20)
        .attr("y", -24)
        .attr("fill", "currentColor")
        .attr("text-anchor", "end")
        .text(data.negative)
    );

  svg
    .append("g")
    .call(d3.axisLeft(y).tickSizeOuter(0))
    .call((g) =>
      g
        .selectAll(".tick")
        .data(bias)
        .attr(
          "transform",
          ([name, min]) =>
            `translate(${x(min)}, ${y(name) + y.bandwidth() / 2})`
        )
    )
    .call((g) => g.select(".domain").attr("transform", `translate(${x(0)},0)`));
});
