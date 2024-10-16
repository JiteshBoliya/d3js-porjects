const width = 1080;
const height = width;
const innerRadius = Math.min(width, height) * 0.5 - 20;
const outerRadius = innerRadius + 6;

d3.csv("../../demo-data/debt.csv").then((data) => {
  const names = Array.from(d3.union(data.flatMap((d) => [d.source, d.target])));
  const index = new Map(names.map((name, i) => [name, i]));
  const matrix = Array.from(index, () => new Array(names.length).fill(0));
  for (const { source, target, value } of data)
    matrix[index.get(source)][index.get(target)] += value;

  const chord = d3
    .chordDirected()
    .padAngle(12 / innerRadius)
    .sortSubgroups(d3.descending)
    .sortChords(d3.descending);

  const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

  const ribbon = d3
    .ribbonArrow()
    .radius(innerRadius - 0.5)
    .padAngle(1 / innerRadius);

  const color = d3.schemeCategory10;
  const formatValue = (x) => `${x.toFixed(0)}B`;

  const svg = d3
    .select("#chord")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "width: 100%; height: auto; font: 10px sans-serif;");

  const chords = chord(matrix);
  //   const textId = DOM.uid("text");

  svg
    .append("path")
    // .attr("id", textId.id)
    .attr("fill", "none")
    .attr("d", d3.arc()({ outerRadius, startAngle: 0, endAngle: 2 * Math.PI }));

  svg
    .append("g")
    .attr("fill-opacity", 0.75)
    .selectAll()
    .data(chords)
    .join("path")
    .attr("d", ribbon)
    .attr("fill", (d) => color[d.target.index])
    .style("mix-blend-mode", "multiply")
    .append("title")
    .text(
      (d) =>
        `${names[d.source.index]} ownes ${names[d.target.index]} ${formatValue(
          d.source.value
        )}`
    );
  const g = svg.append("g").selectAll().data(chords.groups).join("g");

  g.append("path")
    .attr("d", arc)
    .attr("fill", (d) => color[d.index])
    .attr("stroke", "#fff");

  g.append("text")
  .each(d => (d.angle = (d.startAngle + d.endAngle) / 2))
    .attr("dy", -3)
    .attr("transform", d => `
        rotate(${(d.angle * 180 / Math.PI - 90)})
        translate(${outerRadius},-20)
        ${d.angle > Math.PI ? "rotate(90)" : "rotate(90)"}
      `)
    .attr("stratOffset", (d) => d.startAngle * outerRadius)
    .text((d) =>  names[d.index]);

  g.append("title").text(
    (d) =>
      `${names[d.index]} owes ${formatValue(
        d3.sum(matrix[d.index])
      )} is owmed ${formatValue(d3.sum(matrix, (row) => row[d.index]))}`
  );
});
