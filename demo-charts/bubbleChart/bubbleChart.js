d3.csv("../../demo-data/flare.csv").then((data) => {
  data.filter((d) => d.value !== '');
  const width = 928;
  const height = width;
  const margin = 1;
  const name = (d) => d.id.split(".").pop();
  const group = (d) => d.id.split(".")[1];
  const names = (d) => name(d).split(/(?=[A-Z][a-z])|\s+/g);
  const format = d3.format(",d");
  const color = d3.scaleOrdinal(d3.schemeTableau10);
  const pack = d3.pack().size([width - margin * 2, height - margin * 2]);
  const root = pack(d3.hierarchy({ children: data }).sum(d => d.value));

  const svg = d3
    .select("#bubbleChart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-margin, -margin, width, height])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;")
    .attr("text-anchor", "middle");

  const node = svg
    .append("g")
    .selectAll()
    .data(root.leaves())
    .join("g")
    .attr("transform", (d) => `translate(${d.x },${d.y})`);

  node.append("title").text((d) => `${d.data.id}\n${format(d.value)}`);

  node
    .append("circle")
    .attr("fill-opacity", 0.7)
    .attr("fill", (d) =>  color(group(d.data)))
    .attr("r", (d) => d.r);

  const text = node.append("text").attr("clip-path", (d) => `circle(${d.r})`);

  text
    .selectAll()
    .data((d) => names(d.data))
    .join("tspan")
    .attr("x", 0)
    .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.35}em`)
    .text((d) => d);

  text
    .append("tspan")
    .attr("x", 0)
    .attr("y", (d) => `${names(d.data).length / 2 + 0.35}em`)
    .attr("fill-opacity", 0.7)
    .text((d) => format(d.value));
});
