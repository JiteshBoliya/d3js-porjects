const parentElement = document.getElementById("main");
let width = parentElement.clientWidth;
let height = parentElement.clientHeight;

const geojsonFile = "https://unpkg.com/world-atlas@1/world/110m.json";
const countryFile =
  "http://localhost:5501/testDemos/webosmotic/worldMap2/data/countryData.json";
const population1 =
  "http://localhost:5501/testDemos/webosmotic/worldMap2/data/unsd-citypopulation-year-both.csv";

let projection = d3
  .geoEquirectangular()
  .scale((width + height) / 10)
  .translate([width / 2, height / 2]);

let path = d3.geoPath().projection(projection);

const svg = d3
  .select("#worldMap2")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("background", "transparent")
  .call(
    d3
      .zoom()
      .scaleExtent([0.5, 8])
      .on("zoom", function (event) {
        svg.selectAll("path").attr("transform", event.transform);
      })
  );
// Create a ResizeObserver instance
const resizeObserver = new ResizeObserver((entries) => {
  width = $("#worldMap2").width();
  height = $("#worldMap2").height();
  svg.attr("width", width).attr("height", height);

  projection.scale((width + height) / 10).translate([width / 2, height / 2]);
  path.projection(projection);
});

const targetDiv = document.getElementById("worldMap2");
resizeObserver.observe(targetDiv);

// ------------------------------------------------------
const selectionOptionDiv = document.getElementById("selectionOption");

    // Create button element
    const playButton = document.createElement("button");
    playButton.className =
      "w-8 h-8 p-2 mr-2 rounded-md bg-gray-700 focus:outline-none focus:shadow-outline";
    playButton.id = "custom-date";

    // Create image element
    const playIcon = document.createElement("img");
    playIcon.src = "http://localhost:5501/testDemos/webosmotic/worldMap2/data/play.png";  // Adjust the path to your image
    playIcon.alt = "Play";
    playIcon.className = "w-full h-full object-cover rounded-md";

    // Append image to the button
    playButton.appendChild(playIcon);

    // Append button to the container
    selectionOptionDiv.appendChild(playButton);

// -----------------------------------------------------
// Create a select element
const selectElement = document.createElement("select");
selectElement.className = "form-select bg-gray-700 p-2 rounded-md";
selectElement.id = "yearSelection";

// Create options and append them to the select element
const optionValues = [
  { value: 1970, text: "1970" },
  { value: 1976, text: "1976" },
];
for (let i = 1980; i <= 2014; i++)
  optionValues.push({ value: i, text: `${i}` });

optionValues.forEach((option) => {
  const optionElement = document.createElement("option");
  optionElement.value = option.value;
  optionElement.textContent = option.text;
  selectElement.appendChild(optionElement);
});

selectionOptionDiv.appendChild(selectElement);

// -----------------------------------------------------

var maptitle = document.getElementById("maptitle");
var yearSelection = document.getElementById("yearSelection");
var selectionType = 1970;
const color = d3.scaleLinear().domain([0, 5000]).range(["#1e2b45", "darkRed"]);

maptitle.textContent = "Population";

// Create a tooltip
var tooltip = d3.select("body").append("div").attr("class", "tooltip");

function update() {
  d3.json(geojsonFile).then((world) => {
    d3.json(countryFile).then((country) => {
      let map = svg
        .selectAll("path")
        .data(topojson.feature(world, world.objects.countries).features)
        .join("path")
        .attr("d", path)
        .attr("stroke", "white")
        .attr("stroke-width", 0.7);

      //   ---------------------------------------------------
      d3.csv(population1).then((population) => {
        let populationFt = population.filter((p) => p.Year == selectionType);
        calculateColorScale();
        map.attr("fill", (d) => stateColor(d));

        yearSelection.addEventListener("change", function () {
          selectionType = yearSelection.value;
          map.remove();
          update();
        });

        map
          .on("mouseover", function (event, d) {
            d3.select(this).style("fill", "gray");
            let countryData = country.find((c) => c.code === parseInt(d.id));
            if (countryData) {
              var populationData = populationFt.find(
                (d) => d["Country or Area"] === countryData.name
              );
            }
            tooltip
              .style("display", "block")
              .html(
                `<div style='background-color:${stateColor(
                  d
                )};color:white;padding-left:5px'><b>${
                  countryData ? countryData.name : "Unknown"
                }</b></div><hr><div><i>Year: </i><b>${
                  populationData?.Year
                }</b></div><div><i>Sex: </i><b>${
                  populationData?.Sex
                }</b></div><div><i>City: </i><b>${
                  populationData?.City
                }</b></div><div><i>Population: </i><b>${
                  populationData?.Value
                }</b></div>`
              )
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 15 + "px");
          })
          .on("mouseout", function (event, d) {
            d3.select(this).style("fill", (d) => stateColor(d));
            tooltip.style("display", "none");
          })
          .on("mousemove", function (event, d) {
            tooltip
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 15 + "px");
          });

        function stateColor(d) {
          let colorCode = 0;
          let countryData = country.find((c) => c.code === parseInt(d.id));
          if (countryData) {
            let populationData = populationFt.find(
              (d) => d["Country or Area"] === countryData.name
            );
            if (populationData && populationData.Year == selectionType)
              colorCode = populationData.Value;
          }
          return colorCode ? color(colorCode) : "#1e2b45";
        }

        function calculateColorScale() {
          let tempArray = [];
          populationFt.map((s) => {
            if (s.Year == selectionType) tempArray.push(s.Value);
          });

          color
            .domain([Math.min(...tempArray), Math.max(...tempArray)])
            .range(["red", "darkRed"]);
        }
      });
    });
  });
}

update();
