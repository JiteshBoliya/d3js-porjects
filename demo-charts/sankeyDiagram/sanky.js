var margin = { top: 10, right: 10, bottom: 10, left: 10 };

d3.csv("../../demo-data/energy.csv").then((link) => {
  const node = Array.from(
    new Set(link.flatMap((l) => [l.source, l.target])),
    (name) => ({ name, category: name.replace(/ .*/, "") })
  );
  const data = { node, link };

  const width = 928 - margin.left - margin.right ;
  const height = 600;
  const format = d3.format(",.0f");

  const svg = d3
    .select("#sanky")
    .append("svg")
    .attr("width", width+ margin.left + margin.right)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width:100%;height:auto;font:10px sans-serif;");

  const sankey = d3
    .sankey()
    .nodeId((d) => d.name)
    .nodeWidth(15)
    .nodePadding(10)
    .extent([
      [1, 5],
      [width - 1, height - 5],
    ]);

  const { nodes, links } = sankey({
    nodes: data.node.map((d) => Object.assign({}, d)),
    links: data.link.map((d) => Object.assign({}, d)),
  });

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const rect = svg
    .append("g")
    .attr("stroke", "#000")
    .selectAll()
    .data(nodes)
    .join("rect")
    .attr("x", (d) => d.x0)
    .attr("y", (d) => d.y0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("width", (d) => d.x1 - d.x0)
    .attr("fill", (d) => color(d.category));

  rect.append("title").text((d) => `${d.name}\n${format(d.value)} TWh`);

  const linked = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.5)
    .selectAll()
    .data(links)
    .join("g")
    .style("mix-blend-mode", "multiply");

  linked
    .append("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", (d) => color(d.source.category))
    .attr("stroke-width", (d) => Math.max(1, d.width));

  linked
    .append("title")
    .text(
      (d) => `${d.source.name} -> ${d.target.name}\n${format(d.value)} TWh`
    );

  svg
    .append("g")
    .selectAll()
    .data(nodes)
    .join("text")
    .attr("x", (d) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
    .attr("y", (d) => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", (d) => (d.x0 < width / 2 ? "start" : "end"))
    .text((d) => d.name);
  // --------------------------
});
