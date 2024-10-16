let width = window.innerWidth - 100;
let height = window.innerHeight - 100;

const config = {
  speed: 0.01,
  verticalTilted: -10,
  horizontalTilted: 0,
};

let geoSvg = d3
  .select("#geoOrthographicSvg")
  .attr("height", height)
  .attr("width", width);

  let g = geoSvg.append('g');
geoSvg.call(d3.zoom().on('zoom' ,(event) => {
  g.attr('transform',event.translate)
}))

let i = 0;
let starData = [];
while (i < 40) {
  x = Math.floor(Math.random() * width) + 1;
  y = Math.floor(Math.random() * height) + 1;
  r = Math.floor(Math.random() * 3) + 1;
  starData.push({ cx: x, cy: y, r: r });
  i++;
}
geoSvg
  .selectAll("circle")
  .data(starData)
  .join((enter) =>
    enter
      .append("circle")
      .attr("cx", (d) => d.cx)
      .attr("cy", (d) => d.cy)
      .attr("r", (d) => d.r)
      .attr("class", "star")
  );


let projection = d3.geoOrthographic().translate([width / 2, height / 2]);
let pathGenerator = d3.geoPath().projection(projection);

// Outer area of earth
geoSvg
  .append("path")
  .attr("class", "earth")
  .attr("d", pathGenerator({ type: "Sphere" }));

d3.json("https://unpkg.com/world-atlas@1/world/110m.json").then((data) => {
  let countries = topojson.feature(data, data.objects.countries);
  let paths = geoSvg.selectAll("path").data(countries.features);
  paths
    .enter()
    .append("path")
    .attr("class", "country")
    .attr("d", (d) => pathGenerator(d));

  d3.timer((elapsed) => {
    projection.rotate([
      // config.speed * elapsed - 120,
      config.verticalTilted,
      config.horizontalTilted,
    ]);
    geoSvg.selectAll("path").attr("class", "country").attr("d", pathGenerator);
    geoSvg
      .select("path")
      .attr("class", "earth")
      .attr("d", pathGenerator({ type: "Sphere" }));
  });
});
