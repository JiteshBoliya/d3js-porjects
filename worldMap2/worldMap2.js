var script1 =
  "http://localhost:5501/testDemos/webosmotic/worldMap2/scripts/alcohol_consumption.js";
var script2 =
  "http://localhost:5501/testDemos/webosmotic/worldMap2/scripts/population.js";
var script3 =
  "http://localhost:5501/testDemos/webosmotic/worldMap2/scripts/covid-19.js";
var list = d3.selectAll(".categories li");

list.classed("selection-color", false);
list.filter(":first-child").classed("selection-color", true);

const parentElement = document.getElementById("main");
let width = parentElement.clientWidth;
let height = parentElement.clientHeight;

const geojsonFile = "https://unpkg.com/world-atlas@1/world/110m.json";
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
});

const targetDiv = document.getElementById("worldMap2");
resizeObserver.observe(targetDiv);
var maptitle = document.getElementById("maptitle");
const selectElement = document.createElement("select");
const selectionOptionDiv = document.getElementById("selectionOption");
const color = d3.scaleLinear().domain([0, 500]).range(["#1e2b45", "darkRed"]);
var tooltip = d3.select("body").append("div").attr("class", "tooltip");

loadAlcoholData();

list.on("click", function () {
  list.classed("selection-color", false);
  d3.select(this).classed("selection-color", true);

  var clickedItemText = this.textContent;
  if (clickedItemText === "Alcohol consumption") loadAlcoholData();
  else if (clickedItemText === "Population") loadPopulation();
  else if (clickedItemText === "Covid-19") loadCovid();
});

// function isScriptLoaded(scriptSrc) {
//   var scripts = document.getElementsByTagName("script");
//   for (var i = 0; i < scripts.length; i++) {
//     if (scripts[i].src === scriptSrc) {
//       return true;
//     }
//   }
//   return false;
// }

// function loadScript(scriptSrc) {
//   if (!isScriptLoaded(scriptSrc)) {
//     // removeScript();
//     var script = document.createElement("script");
//     script.src = scriptSrc;
//     script.id = "subScript";
//     document.head.appendChild(script);
//   } else {
//     console.log("Script already added");
//   }
// }

// function removeScript() {
//   var scriptElement = document.getElementById("subScript");
//   if (scriptElement) {
//     scriptElement.parentNode.removeChild(scriptElement);
//   }
// }

function loadAlcoholData() {
  svg.selectAll("path").remove();
  const drinksFile =
    "http://localhost:5501/testDemos/webosmotic/worldMap2/data/drinks.csv";

  //Remove selection elements
  if (selectionOptionDiv) {
    while (selectionOptionDiv.firstChild) {
      selectionOptionDiv.removeChild(selectionOptionDiv.firstChild);
    }
  }

  //Remove selection options
  if (selectElement) {
    while (selectElement.firstChild) {
      selectElement.removeChild(selectElement.firstChild);
    }
  }

  // Create a select element
  selectElement.className = "form-select bg-gray-700 p-2 rounded-md";
  selectElement.id = "alcoholSelection";

  // Create options and append them to the select element
  const drinkOptionValues = [
    { value: "spirit_servings", text: "Spirit servings" },
    { value: "beer_servings", text: "Beer servings" },
    { value: "wine_servings", text: "Wine servings" },
    {
      value: "total_litres_of_pure_alcohol",
      text: "Total litres of pure alcohol",
    },
  ];

  drinkOptionValues.forEach((option) => {
    let optionElement = document.createElement("option");
    optionElement.value = option.value;
    optionElement.textContent = option.text;
    selectElement.appendChild(optionElement);
  });

  // Append the select element to the div with id 'selectionOption'
  selectionOptionDiv.appendChild(selectElement);

  var selectionType = "spirit_servings";
  maptitle.textContent = "Alcohol consumption";
  var alcoholSelection = document.getElementById("alcoholSelection");

  function updateAlcoholData() {
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
            updateAlcoholData();
          });

          map
            .on("mouseover", function (event, d) {
              d3.select(this).style("fill", "gray");
              let countryData = country.find((c) => c.code === parseInt(d.id));
              if (countryData) {
                var drinkData = drink.find(
                  (d) => d.country === countryData.name
                );
                // Few data are not showing due to diffrent name of country, need to change in data
              }
              tooltip
                .style("display", "block")
                .html(
                  `<div style='background-color:${stateColor(
                    d
                  )};color:white;padding-left:5px'><b>${
                    countryData ? countryData.name : "Unknown"
                  }</b></div><hr><div><i>Spirit servings: </i><b>${
                    drinkData?.spirit_servings
                  }</b></div><div><i>Beer servings: </i><b>${
                    drinkData?.beer_servings
                  }</b></div><div><i>Wine servings: </i><b>${
                    drinkData?.wine_servings
                  }</b></div><div><i>Total litres of pure alcohol: </i><b>${
                    drinkData?.total_litres_of_pure_alcohol
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

  updateAlcoholData();
}

function loadCovid() {
  svg.selectAll("path").remove();

  var world = null;
  var country = null;
  var covid_19 = null;

  const covid =
    "http://localhost:5501/testDemos/webosmotic/worldMap2/data/covid.csv";

  if (selectionOptionDiv) {
    while (selectionOptionDiv.firstChild) {
      selectionOptionDiv.removeChild(selectionOptionDiv.firstChild);
    }
  }

  // Create button element
  const playButton = document.createElement("button");
  playButton.className =
    "w-8 h-8 p-2 mr-2 rounded-md bg-gray-700 focus:outline-none focus:shadow-outline";
  playButton.id = "custom-date";

  // Create image element
  const playIcon = document.createElement("img");
  playIcon.src =
    "http://localhost:5501/testDemos/webosmotic/worldMap2/data/play.png"; // Adjust the path to your image
  playIcon.alt = "Play";
  playIcon.className = "w-full h-full object-cover rounded-md";

  // Append image to the button
  playButton.appendChild(playIcon);

  // Append button to the container
  selectionOptionDiv.appendChild(playButton);

  // Append the select element to the div with id 'selectionOption'
  const dateInput = document.createElement("input");
  let selectionDate = "2020-01-22";
  dateInput.value = selectionDate;
  dateInput.type = "date";
  dateInput.className =
    "form-select appearance-none rounded p-1.5 mr-2 rounded-md bg-gray-700  focus:outline-none focus:shadow-outline";
  dateInput.id = "custom-date";

  selectionOptionDiv.appendChild(dateInput);

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

  var statusSelection = document.getElementById("statusSelection");
  var selectionType = "Confirmed";

  maptitle.textContent = "Covid-19";

  d3.json(geojsonFile).then((worlds) => {
    d3.json(countryFile).then((countrys) => {
      d3.csv(covid).then((covid) => {
        world = worlds;
        country = countrys;
        covid_19 = covid;
        updateCovid();
      });
    });
  });

  function updateCovid() {
    if (world != null && country != null && covid_19 != null) {
      let map = svg
        .selectAll("path")
        .data(topojson.feature(world, world.objects.countries).features)
        .join("path")
        .attr("d", path)
        .attr("stroke", "white")
        .attr("stroke-width", 0.7);

      covid_19.sort((a, b) => a.Date - b.Date);
      dateInput.max = covid_19[covid_19.length - 1].Date;
      dateInput.min = covid_19[0].Date;
      calculateColorScale();
      map.attr("fill", (d) => stateColor(d));

      statusSelection.addEventListener("change", function () {
        selectionType = statusSelection.value;
        map.remove();
        updateCovid();
      });

      dateInput.addEventListener("change", function () {
        selectionDate = dateInput.value;
        map.remove();
        updateCovid();
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
          const dateFormatter = new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          const numberFormatter = new Intl.NumberFormat("en-US");

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
              }</b></div><div><i>Confirmed: </i><b>${numberFormatter.format(
                parseInt(covidData ? covidData.Confirmed : 0)
              )}</b></div><div><i>Deaths: </i><b>${numberFormatter.format(
                parseInt(covidData ? covidData.Deaths : 0)
              )}</b></div><div><i>Recovered: </i><b>${numberFormatter.format(
                parseInt(covidData ? covidData.Recovered : 0)
              )}</b></div>`
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
          if (covidData) colorCode = parseInt(covidData[selectionType]) * 10;
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
        let maxValue =
          covid_19[length][selectionType] > 0
            ? covid_19[length][selectionType]
            : 1000;
        color.domain([0, maxValue]).range(["#1e2b45", colorRange]);
      }
    }
  }

  updateCovid();
}

function loadPopulation() {
  const population1 =
    "http://localhost:5501/testDemos/webosmotic/worldMap2/data/unsd-citypopulation-year-both.csv";

  svg.selectAll("path").remove();

  if (selectionOptionDiv) {
    // Remove all child elements
    while (selectionOptionDiv.firstChild) {
      selectionOptionDiv.removeChild(selectionOptionDiv.firstChild);
    }
  } else {
    console.error("Parent element not found");
  }

  // Create button element
  const playButton = document.createElement("button");
  playButton.className =
    "w-8 h-8 p-2 mr-2 rounded-md bg-gray-700 focus:outline-none focus:shadow-outline";
  playButton.id = "custom-date";

  // Create image element
  const playIcon = document.createElement("img");
  playIcon.src =
    "http://localhost:5501/testDemos/webosmotic/worldMap2/data/play.png"; // Adjust the path to your image
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

  var maptitle = document.getElementById("maptitle");
  var yearSelection = document.getElementById("yearSelection");
  var selectionType = 1970;

  maptitle.textContent = "Population";

  function updatePopulationData() {
    d3.json(geojsonFile).then((world) => {
      d3.json(countryFile).then((country) => {
        let map = svg
          .selectAll("path")
          .data(topojson.feature(world, world.objects.countries).features)
          .join("path")
          .attr("d", path)
          .attr("stroke", "white")
          .attr("stroke-width", 0.7);

        d3.csv(population1).then((population) => {
          let populationFt = population.filter((p) => p.Year == selectionType);
          calculateColorScale();
          map.attr("fill", (d) => stateColor(d));

          yearSelection.addEventListener("change", function () {
            selectionType = yearSelection.value;
            map.remove();
            updatePopulationData();
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
              .range(["#ffc8c9", "#3f0001"]);
          }
        });
      });
    });
  }

  updatePopulationData();
}
