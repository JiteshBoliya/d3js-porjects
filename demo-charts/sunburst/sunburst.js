let margin = { top: 10, right: 10, bottom: 10, left: 10 };
let width = 928 - margin.left - margin.right;
let height = width;
let radius = width / 8;

let svg = d3
  .select("#sunburst")
  .append("svg")
  .attr("viewBox", [-width / 2, -height / 2, width, width])
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + -10 + "," + margin.top + ")");

d3.json("../../demo-data/flare-2.json").then((data) => {

  // Color scale
  const color = d3.scaleOrdinal(
    d3.quantize(d3.interpolateRainbow, data.children.length + 1)
  );

  // Hirerachy data
  const hierarchy = d3
    .hierarchy(data)
    .sum((d) => d.value)
    .sort((a, b) => b.value - a.value);

  // Root datas
  const root = d3.partition().size([2 * Math.PI, hierarchy.height + 1])(
    hierarchy
  );

  // Set the current to all data
  root.each((d) => (d.current = d));

  //  Created arc
  const arc = d3
    .arc()
    .startAngle((d) => d.x0)
    .endAngle((d) => d.x1)
    .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius * 1.5)
    .innerRadius((d) => d.y0 * radius)
    .outerRadius((d) => Math.max(d.y0 * radius, d.y1 * radius - 1));

  // Created path
  const path = svg
    .append("g")
    .selectAll("path")
    .data(root.descendants().slice(1))
    .join("path")
    .attr("fill", (d) => {
      while (d.depth > 1) d = d.parent;
      return color(d.data.name);
    })
    .attr("fill-opacity", (d) =>
      arcVisible(d.current) ? (d.children != undefined ? 0.6 : 0.4) : 0
    )
    .attr("pointer-events", (d) => (arcVisible(d.current) ? "auto" : "none"))
    .attr("d", (d) => arc(d.current));

  // Click event mathod
  let clicked = (event, p) => {
    // Update the data as event 
    parent.datum(p.parent || root);
  
    root.each((d) => {
      // if (!d) return;
      return (d.traget = {
        x0:
          Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        x1:
          Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        y0: Math.max(0, d.y0 - p.depth),
        y1: Math.max(0, d.y1 - p.depth),
      });
    });

    // Created Transition
    const t = svg.transition().duration(750);

    // Applied the changes with transition for path

    path
      .transition(t)
      .tween("root", (d) => {
        const i = d3.interpolate(d.current, d.traget);
        return (t) => (d.current = i(t));
      })
      .filter((d) => path.attr("fill-opacity") || arcVisible(d.traget))
      .attr("fill-opacity", (d) => arcVisible(d.traget) ? (d.children ? 0.6 : 0.4) : 0)
      .attr("pointer-events", (d) => arcVisible(d.traget) ? "auto" : "none")
      .attrTween("d", (d) => () => arc(d.current));

    // Applied the changes with transition for lable
    label
      .filter((d) => label.attr("fill-opacity") ||  labelVisible(d.traget))
      .transition(t)
      .attr("fill-opacity", (d) => +labelVisible(d.traget))
      .attrTween("transform", (d) => () => labelTransform(d.current));
  };

  // Click event for fatching children
  path
    .filter((d) => d.children)
    .style("cursor", "pointer")
    .on("click", clicked);
   

  //  Format number text for tooltip
  const format = d3.format(",d");

  // Tooltip for graph
  path.append("title").text(
    (d) =>
      d
        .ancestors()
        .map((d) => d.data.name)
        .reverse()
        .join("/") +
      `\n` +
      format(d.value)
  );

  //  Set the lable on the graph
  const label = svg
    .append("g")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .style("user-select", "none")
    .selectAll("text")
    .data(root.descendants().slice(1))
    .join("text")
    .attr("dy", "0.35em")
    .attr("fill-opacity", (d) => +labelVisible(d.current))
    .attr("transform", (d) => labelTransform(d.current))
    .text((d) => d.data.name);

  // Click event for fatching parent
  const parent = svg
    .append("circle")
    .datum(root)
    .attr("r", radius)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("click", clicked);
});

// Set arc visibility
arcVisible = (d) => {
  return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
};

// Set lable visibility
labelVisible = (d) => {
  return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
};

// Set lable transition
labelTransform = (d) => {
  const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
  const y = ((d.y0 + d.y1) / 2) * radius;
  return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
};
