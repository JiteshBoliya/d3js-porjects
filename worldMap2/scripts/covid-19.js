const parentElement = document.getElementById("main");
let width = parentElement.clientWidth;
let height = parentElement.clientHeight;

const geojsonFile = "https://unpkg.com/world-atlas@1/world/110m.json";
const countryFile =
  "http://localhost:5501/testDemos/webosmotic/worldMap2/data/countryData.json";
const covid =
  "http://localhost:5501/testDemos/webosmotic/worldMap2/data/covid.csv";

let projection = d3
  .geoEquirectangular()
  .scale((width + height) / 10)
  .translate([width / 2, height / 2]);

let path = d3.geoPath().projection(projection);

var world = null;
var country = null;
var covid_19 = null;

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


// ------------------------------------------------------

// Append the select element to the div with id 'selectionOption'
const dateInput = document.createElement("input");
let selectionDate = "2020-01-22";
dateInput.value = selectionDate;
dateInput.type = "date";
dateInput.className =
  "form-select appearance-none rounded p-1.5 mr-2 rounded-md bg-gray-700  focus:outline-none focus:shadow-outline";
dateInput.id = "custom-date";

selectionOptionDiv.appendChild(dateInput);

// -----------------------------------------------------
// Create a select element
const selectElement = document.createElement("select");
selectElement.className = "form-select bg-gray-700 p-2 rounded-md";
selectElement.id = "statusSelection";

// Create options and append them to the select element
const optionValues = [
  { value: "Confirmed", text: "Confirmed" },
  { value: "Deaths", text: "Deaths" },
  { value: "Recovered", text: "Recovered" },
];

optionValues.forEach((option) => {
  const optionElement = document.createElement("option");
  optionElement.value = option.value;
  optionElement.textContent = option.text;
  selectElement.appendChild(optionElement);
});

selectionOptionDiv.appendChild(selectElement);

// -----------------------------------------------------

var maptitle = document.getElementById("maptitle");
var statusSelection = document.getElementById("statusSelection");
var selectionType = "Confirmed";
const color = d3.scaleLinear().domain([0, 5000]).range(["#1e2b45", "#1e2b45"]);

maptitle.textContent = "Covid-19";

// Create a tooltip
var tooltip = d3.select("body").append("div").attr("class", "tooltip");

d3.json(geojsonFile).then((worlds) => {
  d3.json(countryFile).then((countrys) => {
    d3.csv(covid).then((covid) => {
      world = worlds;
      country = countrys;
      covid_19 = covid;
      update();
    });
  });
});

function update() {
  if (world != null && country != null && covid_19 != null) {
    let map = svg
      .selectAll("path")
      .data(topojson.feature(world, world.objects.countries).features)
      .join("path")
      .attr("d", path)
      .attr("stroke", "white")
      .attr("stroke-width", 0.7);

    console.log("called");
    covid_19.sort((a, b) => a.Date - b.Date);
    dateInput.max = covid_19[covid_19.length - 1].Date;
    dateInput.min = covid_19[0].Date;
    calculateColorScale();
    map.attr("fill", (d) => stateColor(d));

    statusSelection.addEventListener("change", function () {
      selectionType = statusSelection.value;
      map.remove();
      update();
    });

    dateInput.addEventListener("change", function () {
      selectionDate = dateInput.value;
      map.remove();
      update();
    });

    map
      .on("mouseover", function (event, d) {
        d3.select(this).style("fill", "gray");
        let countryData = country.find((c) => c.code === parseInt(d.id));
        if (countryData) {
          var covidData = covid_19.find(
            (d) => d.Country === countryData.name && d.Date === selectionDate
          );
        }
        const dateFormatter = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const numberFormatter =  new Intl.NumberFormat('en-US');
        
        tooltip
          .style("display", "block")
          .html(
            `<div style='background-color:${stateColor(
              d
            )};color:white;padding-left:5px'><b>${
              countryData ? countryData.name : "Unknown"
            }</b></div><hr><div><i>Date: </i><b>${
              // dateFormatter.format(covidData?.Date)
              covidData?.Date
            }</b></div><div><i>Confirmed: </i><b>${
              numberFormatter.format(parseInt(covidData?covidData.Confirmed:0))
            }</b></div><div><i>Deaths: </i><b>${
              numberFormatter.format(parseInt(covidData?covidData.Deaths:0))
            }</b></div><div><i>Recovered: </i><b>${
              numberFormatter.format(parseInt(covidData?covidData.Recovered:0))
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
        let covidData = covid_19.find(
          (d) => d.Country === countryData.name && d.Date === selectionDate
        );
        if (covidData) colorCode = parseInt(covidData[selectionType])*10;
      }
      return colorCode ? color(colorCode) : color(0);
    }

    function calculateColorScale() {
      let tempArray = [];
      let colorRange = "#1e2b45";
      switch (selectionType) {
        case "Confirmed": {
          colorRange = "#930046";
          break;
        }
        case "Deaths": {
          colorRange = "darkRed";
          break;
        }
        case "Recovered": {
          colorRange = "#0d6800";
          break;
        }
      }

      covid_19.map((s) => {
        if (s[selectionType] !== null) tempArray.push(s[selectionType]);
      });
      covid_19.sort((a, b) => a[selectionType] - b[selectionType]);
      let length = covid_19.length - 1;
      let maxValue = covid_19[length][selectionType] > 0 ? covid_19[length][selectionType]: 1000;
      console.log(covid_19[length][selectionType]);
      color
        .domain([0,maxValue])
        .range(["#1e2b45", colorRange]);
    }
  }
}

update();