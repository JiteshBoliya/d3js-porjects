var margin = { top: 10, right: 10, bottom: 10, left: 10 },
  width = 650 - margin.left - margin.right,
  height = width;

d3.json("../../demo-data/flare-2.json").then((data) => {
  console.log("data", data);

  let color = d3
    .scaleLinear()
    .domain([0, 5])
    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    .interpolate(d3.interpolateHcl);

  let svg = d3
    .select("#circlePacking")
    .append("svg")
    .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("background-color", "lightGray")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  const hierarch = d3
    .hierarchy(data)
    .sum((d) => d.value)
    .sort((a, b) => b.value - a.value);
  const pack = (data) => d3.pack().size([width, height]).padding(3)(hierarch);
  const root = pack(data);

  const node = svg
    .append("g")
    .selectAll("circle")
    .data(root.descendants().slice(1))
    .join("circle")
    .attr("id", (d) => d.data.name)
    .attr("fill", (d) => (d.children ? color(d.depth) : "white"))
    .attr("pointer-events", (d) => (!d.children ? "none" : null))
    .on("mouseover", () => {
      d3.selectAll((d) => {
      console.log("circle "+ d.data.name);  
        // need to fix this issue
      }).attr("stroke", "#000");
    })
    .on("mouseout", () => {
      d3.selectAll("circle").attr("stroke", null);
    })
    .on("click", (event, d) => focus !== d && (zoom(event,d), event.stopPropagation()))

  const label = svg
    .append("g")
    .style("font", "10px sans-serif")
    .attr("pointer-events", "none")
    .attr("tect-anchor", "middle")
    .selectAll("text")
    .data(root.descendants())
    .join("text")
    .style("fill-opacity", (d) => (d.parent === root ? 1 : 0))
    .style("display", (d) => (d.parent === root ? "inline" : "none"))
    .text((d) => d.data.name);

  svg.on("click", (event) => zoom(event, root));
  let focus = root;
  let view;

  zoomTo = (v) => {
    const k = width / v[2];
    view = v;
    label.attr(
      "transform",
      (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
    );
    node.attr(
      "transform",
      (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
    );
    node.attr("r", (d) => d.r * k);
  };

  zoomTo([focus.x, focus.y, focus.r * 2]);

  zoom = (event, d) => {
    console.log("click",d);
    const focus0 = focus;
    focus = d;
    const transition = svg
      .transition()
      .duration(event.altKey ? 7500 : 750)
      .tween("zoom", (d) => {
        const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
        return (t) => zoomTo(i(t));
      });

    label
      .filter((d) => d.parent === focus || label.style("display") === "inline")
      .transition(transition)
      .style("fill-opacity", (d) => (d.parent === focus ? 1 : 0))
      .on("start", (d) => {
        if (d.parent === focus) label.style("display", "inline");
      })
      .on("end", (d) => {
        if (d.parent !== focus) label.style("display", "none");
      });
  };
});
