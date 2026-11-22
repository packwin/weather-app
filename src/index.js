import "./styles.css";
import { format } from "date-fns";

let unitSystem = "metric";
const apiKey = "XU6MRLHJAPADPYD5A24SMVMJ4";
let lastLoc;

const inputLoc = document.getElementById("input-location");
const btnSearch = document.getElementById("btn-search");

const overviewLoc = document.getElementById("overview-location");
const overviewConds = document.getElementById("overview-conditions");

const overviewTemp = document.getElementById("overview-temp");
const overviewTempFL = document.getElementById("overview-temp-feels-like");

const overviewPrecipChanceHeader = document.getElementById(
  "overview-precip-chance-header",
);
const overviewPrecipChance = document.getElementById("overview-precip-chance");
const overviewHumidity = document.getElementById("overview-humidity");
const overviewUVIndex = document.getElementById("overview-uv-index");
const overviewWindSpeed = document.getElementById("overview-wind-speed");

const btnUnitSys = document.getElementById("btn-unit-sys");

const forecastHourly = document.getElementById("forecast-hourly");

btnSearch.addEventListener("click", () => {
  getWeatherData(inputLoc.value).then((data) => buildPageFromData(data));
});

inputLoc.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    getWeatherData(inputLoc.value).then((data) => buildPageFromData(data));
  }
});

btnUnitSys.addEventListener("click", () => {
  unitSystem = unitSystem === "metric" ? "us" : "metric";
  btnUnitSys.textContent = unitSystem === "metric" ? "C°" : "F°";

  if (lastLoc != undefined) {
    getWeatherData(lastLoc).then((data) => buildPageFromData(data));
  }
});

async function getWeatherData(location) {
  try {
    const date = format(new Date(), "yyyy-M-d");

    const response = await fetch(
      `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}/${date}?unitGroup=${unitSystem}&key=${apiKey}`,
    );

    if (!response.ok) {
      throw new Error(
        `getWeatherData() Fetch response status: ${response.status} ${response.statusText}`,
      );
    }

    const json = await response.json();

    if (json != undefined) {
      lastLoc = location;
      return json;
    } else {
      throw new Error("Json equals undefined. . .");
    }
  } catch (error) {
    console.error(error.message);
  }
}

function buildPageFromData(data) {
  console.log(data);

  forecastHourly.replaceChildren();

  const today = data.days[0];
  overviewLoc.textContent = data.address;
  overviewConds.textContent = today.conditions;
  overviewTemp.textContent = today.temp + "°";
  overviewTempFL.textContent = `Feels like ${today.feelslike}°${getUnitSymbol()}`;
  overviewPrecipChanceHeader.textContent = `Chance of ${today.precipType != null ? today.preciptype[0].charAt(0).toUpperCase() + today.preciptype[0].slice(1) : "Precip."}`;
  overviewPrecipChance.textContent = today.precipprob + "%";
  overviewHumidity.textContent = today.humidity + "%";
  overviewUVIndex.textContent = today.uvindex;
  overviewWindSpeed.textContent =
    today.windspeed + (unitSystem === "metric" ? "km/h" : "mph");

  let idx = 0;
  today.hours.forEach((hour) => {
    const container = document.createElement("div");
    container.classList.add("forecast-hourly-entry");

    const time = document.createElement("p");
    time.textContent =
      idx === 0 ? "12AM" : idx > 12 ? idx - 12 + "PM" : idx + "AM";
    container.append(time);

    const infoContainer = document.createElement("div");
    container.append(infoContainer);

    const temp = document.createElement("p");
    temp.textContent = hour.temp + getUnitSymbol();
    infoContainer.append(temp);

    const precipChance = document.createElement("p");
    precipChance.textContent = hour.precipprob + "%";
    infoContainer.append(precipChance);

    forecastHourly.append(container);

    idx++;
  });
}

function getUnitSymbol() {
  return `°${unitSystem === "metric" ? "C" : "F"}`;
}
