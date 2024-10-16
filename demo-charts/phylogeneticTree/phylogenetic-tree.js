width = 957;
outerRadius = width / 2;
innerRadius = outerRadius - 170;

d3.text("../../demo-data/life.txt").then((data) => {
  // Convert text data to json
  data = parseNewObj(data);

  // Get the heirarchy
  const root = d3
    .hierarchy(data, (d) => d.branchset)
    .sum((d) => (d.branchset ? 0 : 1))
    .sort(
      (a, b) => a.value - b.value || d3.ascending(a.data.length, b.data.length)
    );

  // Scaling tree with same depth
  cluster(root);
  setRadius(root, (root.data.length = 0), innerRadius / maxLength(root));
  setColor(root);

  // Created svg
  const svg = d3
    .select("#phylogeneticTree")
    .append("svg")
    .attr("viewBox", [-outerRadius, -outerRadius, width, width])
    .attr("font-family", "sans-serif")
    .attr("font-size", 10);

  svg.append("g").call(legend);
  svg.append("style").text(`

  .link--active {
    stroke: #000 !important;
    stroke-width: 1.5px;
  }
  
  .link-extension--active {
    stroke-opacity: .6;
  }
  
  .label--active {
    font-weight: bold;
  }
  
  `);

  // svg
  //   .append("g")
  //   .attr("fill", "none")
  //   .attr("stroke", "#000")
  //   .attr("stroke-opacity", 0.25)
  //   .selectAll("path")
  //   .data(root.links().filter((d) => !d.target.children))
  //   .join("path")
  //   .each(function (d) {
  //     d.target.linkExtensionNode = this;
  //   })
  //   .attr("d", linkExtensionConstant);

  svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#000")
    .selectAll("path")
    .data(root.links())
    .join("path")
    .each(function (d) {
      d.target.linkNode = this;
    })
    .attr("d", linkVariable)
    .attr("stroke", (d) => d.target.color);

  svg
    .append("g")
    .selectAll("text")
    .data(root.leaves())
    .join("text")
    .attr("dy", ".31em")
    .attr(
      "transform",
      (d) =>
        `rotate(${d.x - 90}) translate(${innerRadius + 4},0)${
          d.x < 180 ? "" : "rotate(180)"
        }`
    )
    .attr("text-anchor", (d) => (d.x < 180 ? "start" : "end"))
    .text((d) => d.data.name.replace(/_/g, " "))
    .on("mouseover", mouseovered(true))
    .on("mouseout", mouseovered(false));
});

cluster = d3
  .cluster()
  .size([360, innerRadius])
  .separation((a, b) => 1);

color = d3
  .scaleOrdinal()
  .domain(["Bacteria", "Eukaryota", "Archaea"])
  .range(d3.schemeCategory10);

maxLength = (d) =>
  d.data.length + (d.children ? d3.max(d.children, maxLength) : 0);

setRadius = (d, y0, k) => {
  d.radius = (y0 += d.data.length) * k;
  if (d.children) d.children.forEach((d) => setRadius(d, y0, k));
};

setColor = (d) => {
  var name = d.data.name;
  d.color =
    color.domain().indexOf(name) >= 0
      ? color(name)
      : d.parent
      ? d.parent.color
      : null;
  if (d.children) d.children.forEach(setColor);
};

parseNewObj = (data) => {
  for (
    var e = [], r = {}, s = data.split(/\s*(;|\(|\)|,|:)\s*/), t = 0;
    t < s.length;
    t++
  ) {
    var n = s[t];
    switch (n) {
      case "(":
        var c = {};
        (r.branchset = [c]), e.push(r), (r = c);
        break;
      case ",":
        var c = {};
        e[e.length - 1].branchset.push(c), (r = c);
        break;
      case ")":
        r = e.pop();
        break;
      default:
        var h = s[t - 1];
        ")" == h || "(" == h || "," == h
          ? (r.name = n)
          : ":" == h && (r.length = parseFloat(n));
    }
  }
  return r;
};

legend = (svg) => {
  const g = svg
    .selectAll("g")
    .data(color.domain())
    .join("g")
    .attr(
      "transform",
      (d, i) => `translate(${-outerRadius}, ${-outerRadius + i * 20})`
    );

  g.append("rect").attr("width", 18).attr("height", 18).attr("fill", color);

  g.append("text")
    .attr("x", 24)
    .attr("y", 9)
    .attr("dy", "0.35em")
    .text((d) => d);
};

linkConstant = (d) => linkStep(d.source.x, d.source.y, d.target.x, d.target.y);

linkExtensionConstant = (d) =>
  linkStep(d.target.x, d.target.y, d.target.x, innerRadius);

linkVariable = (d) =>
  linkStep(d.source.x, d.source.radius, d.target.x, d.target.radius);

linkExtensionVariable = (d) =>
  linkStep(d.target.x, d.target.radius, d.target.x, innerRadius);

linkStep = (startAngle, startRadius, endAngle, endRadius) => {
  const c0 = Math.cos((startAngle = ((startAngle - 90) / 180) * Math.PI));
  const s0 = Math.sin(startAngle);
  const c1 = Math.cos((endAngle = ((endAngle - 90) / 180) * Math.PI));
  const s1 = Math.sin(endAngle);
  return (
    "M" +
    startRadius * c0 +
    "," +
    startRadius * s0 +
    (endAngle === startAngle
      ? " "
      : "A" +
        startRadius +
        "," +
        startRadius +
        " 0 0 " +
        (endAngle > startAngle ? 1 : 0) +
        " " +
        startRadius * c1 +
        "," +
        startRadius * s1) +
    "L" +
    endRadius * c1 +
    "," +
    endRadius * s1
  );
};

mouseovered = (active) => {
  return function (event, d) {
    d3.select(this).classed("label--active", active);
    // d3.select(d.linkExtensionNode)
    //   .classed("link-extension--active", active)
    //   .raise();
    do d3.select(d.linkNode).classed("link--active", active).raise();
    while ((d = d.parent));
  };
};
