const parentElement = document.getElementById("main");
let width = parentElement.clientWidth;
let height = parentElement.clientHeight;

const geojsonFile = "https://unpkg.com/world-atlas@1/world/110m.json";
const drinksFile =
  "http://localhost:5501/testDemos/webosmotic/worldMap2/data/drinks.csv";
const countryFile =
  "http://localhost:5501/testDemos/webosmotic/worldMap2/data/countryData.json";

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

  update();
});

const targetDiv = document.getElementById("worldMap2");
resizeObserver.observe(targetDiv);

var maptitle = document.getElementById("maptitle");

// -----------------------------------------------------
// Create a select element
const selectElement = document.createElement('select');
selectElement.className = 'form-select bg-gray-700 p-2 rounded-md';
selectElement.id = 'alcoholSelection';

// Create options and append them to the select element
const optionValues = [
    { value: 'spirit_servings', text: 'Spirit servings' },
    { value: 'beer_servings', text: 'Beer servings' },
    { value: 'wine_servings', text: 'Wine servings' },
    { value: 'total_litres_of_pure_alcohol', text: 'Total litres of pure alcohol' }
];

optionValues.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.value;
    optionElement.textContent = option.text;
    selectElement.appendChild(optionElement);
});

// Append the select element to the div with id 'selectionOption'
const selectionOptionDiv = document.getElementById('selectionOption');
selectionOptionDiv.appendChild(selectElement);

// -----------------------------------------------------

var alcoholSelection = document.getElementById("alcoholSelection");
var selectionType = "spirit_servings";
const color = d3.scaleLinear().domain([0, 500]).range(["#1e2b45", "darkRed"]);

maptitle.textContent = "Alcohol consumption";

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
      d3.csv(drinksFile).then((drink) => {
        calculateColorScale();
        map.attr("fill", (d) => stateColor(d));

        alcoholSelection.addEventListener("change", function () {
          selectionType = alcoholSelection.value;
          map.remove();
          update();
        });

        map
          .on("mouseover", function (event, d) {
            d3.select(this).style("fill", "gray");
            let countryData = country.find((c) => c.code === parseInt(d.id));
            if (countryData) {
              var drinkData = drink.find((d) => d.country === countryData.name);
              // Few data are not showing due to diffrent name of country, need to change in data
            }
            tooltip
              .style("display", "block")
              .html(
                `<div style='background-color:${stateColor(
                  d
                )};color:white;padding-left:5px'><b>${countryData ? countryData.name : "Unknown"
                }</b></div><hr><div><i>Spirit servings: </i><b>${drinkData?.spirit_servings
                }</b></div><div><i>Beer servings: </i><b>${drinkData?.beer_servings
                }</b></div><div><i>Wine servings: </i><b>${drinkData?.wine_servings
                }</b></div><div><i>Total litres of pure alcohol: </i><b>${drinkData?.total_litres_of_pure_alcohol
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
            let drinkData = drink.find((d) => d.country === countryData.name);
            if (drinkData) colorCode = drinkData[selectionType];
          }
          return colorCode ? color(colorCode) : color(0);
        }

        function calculateColorScale() {
          let tempArray = [];
          let colorRange = "#1e2b45";
          switch (selectionType) {
            case "spirit_servings": {
              colorRange = "#f3ff00";
              break;
            }
            case "beer_servings": {
              colorRange = "#ff7200";
              break;
            }
            case "wine_servings": {
              colorRange = "#f00";
              break;
            }
            case "total_litres_of_pure_alcohol": {
              colorRange = "#00f7ff";
              break;
            }
          }

          drink.map((s) => {
            if (s[selectionType] !== null) tempArray.push(s[selectionType]);
          });
          color
            .domain([Math.min(...tempArray), Math.max(...tempArray)])
            .range(["#1e2b45", colorRange]);
        }
      });
    });
  });
}



update();
