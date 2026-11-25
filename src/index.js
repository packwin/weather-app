import "./styles.css";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { getIcon } from "./icons.js";
import { getBackgroundImg } from "./overviewbg.js";

let unitSystem = "metric";
const apiKey = "XU6MRLHJAPADPYD5A24SMVMJ4";
let lastLoc;

const inputLoc = document.getElementById("input-location");
const btnSearch = document.getElementById("btn-search");

const overview = document.getElementById("overview");

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
const forecastDailyContainer = document.getElementById(
  "forecast-daily-container",
);
const forecastDaily = document.getElementById("forecast-daily");

const spinner = document.getElementById("spinner");

btnSearch.addEventListener("click", () => {
  handleSearch(inputLoc.value);
});

inputLoc.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleSearch(inputLoc.value);
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
  const response = await fetch(
    `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}/yesterday/next3days?unitGroup=${unitSystem}&key=${apiKey}&&elements=remove:moonphase,remove:pressure,remove:severerisk,remove:solarenergy,remove:solarradiation,remove:sunriseEpoch,remove:sunsetEpoch,remove:visibility,remove:windgust`,
  );

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(
      `getWeatherData() Fetch response status: ${response.status} ${response.statusText} ${body}`,
    );
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return response.json();
}

async function handleSearch(query) {
  try {
    spinner.style.display = "inline";
    const data = await getWeatherData(query);

    lastLoc = query;
    overview.style.display = "flex";
    forecastDailyContainer.style.display = "flex";
    buildPageFromData(data);
    spinner.style.display = "none";
  } catch (error) {
    console.error(error);
    if (error.status) {
      alert(
        `Could not fetch data for query "${inputLoc.value}": ${error.body}.`,
      );
    } else {
      alert(
        `Could not fetch data for query "${inputLoc.value}": ${error.message}`,
      );
    }
    spinner.style.display = "none";
  }
}

function buildPageFromData(data) {
  console.log(data);

  // #region Overview
  forecastHourly.replaceChildren();

  const todayStr = formatInTimeZone(new Date(), data.timezone, "yyyy-MM-dd");
  const todayIndex = data.days.findIndex((day) => day.datetime === todayStr);
  const today = data.days[todayIndex];

  overviewLoc.textContent =
    data.address.charAt(0).toUpperCase() + data.address.slice(1);
  overviewConds.textContent = today.conditions;
  overviewTemp.textContent = today.temp + "°";
  overviewTempFL.textContent = `Feels like ${today.feelslike}${getUnitSymbol()}`;
  overviewPrecipChanceHeader.textContent = `Chance of ${today.preciptype != null ? today.preciptype[0].charAt(0).toUpperCase() + today.preciptype[0].slice(1) : "Precip."}`;
  overviewPrecipChance.textContent = today.precipprob + "%";
  overviewHumidity.textContent = today.humidity + "%";
  overviewUVIndex.textContent = today.uvindex;
  overviewWindSpeed.textContent =
    today.windspeed + (unitSystem === "metric" ? "km/h" : "mph");

  const yesterday = data.days[todayIndex - 1];
  const tomorrow = data.days[todayIndex + 1];
  const totalHours = [
    ...yesterday.hours.slice(12),
    ...today.hours,
    ...tomorrow.hours.slice(0, 12),
  ];

  const nowTime = formatInTimeZone(new Date(), data.timezone, "HH:mm:ss");
  const hour = parseInt(nowTime.split(":")[0]);
  const period =
    nowTime > today.sunrise && nowTime < today.sunset ? "day" : "night";
  const textOutline = period === "day" ? "white" : "black";
  overview.style.textShadow = `
    -1px -1px 0 ${textOutline},  
     1px -1px 0 ${textOutline},
    -1px  1px 0 ${textOutline},
     1px  1px 0 ${textOutline}
  `;

  let hourNodes = [];
  totalHours.forEach((hour) => {
    const container = document.createElement("div");
    container.classList.add("forecast-hourly-entry");

    const time = document.createElement("p");
    const hourNumber = parseInt(hour.datetime.split(":")[0]);
    time.textContent = `${hourNumber % 12 || 12} ${hourNumber < 12 ? "am" : "pm"}`;
    container.append(time);

    const icon = document.createElement("span");
    icon.classList.add("icon");
    icon.style.maskImage = `url(${getIcon(hour.icon)})`;
    icon.style.backgroundColor = period === "day" ? "black" : "white";

    const iconWrapper = document.createElement("div");
    iconWrapper.classList.add("icon-wrapper");
    const outlineColour = period === "day" ? "white" : "black";
    iconWrapper.style.filter = `
      drop-shadow(1px 0 0 ${outlineColour})
      drop-shadow(-1px 0 0 ${outlineColour})
      drop-shadow(0 1px 0 ${outlineColour})
      drop-shadow(0 -1px 0 ${outlineColour})
    `;
    iconWrapper.append(icon);
    container.append(iconWrapper);

    const temp = document.createElement("p");
    temp.textContent = hour.temp + getUnitSymbol();
    container.append(temp);

    forecastHourly.append(container);
    hourNodes.push(container);
  });

  hourNodes[hour + 12].scrollIntoView({
    behavior: "instant",
    block: "center",
    inline: "center",
  });
  hourNodes[hour + 12].classList.add("forecast-hourly-entry-current-hour");

  const name = today.icon;
  const tint = period === "day" ? "255, 255, 255" : "0, 0, 0";
  if (
    !name.includes("day") ||
    (!name.includes("night") && name !== "thunder-rain")
  ) {
    overview.style.backgroundImage = `
    linear-gradient(270deg, 
    rgba(${tint}, 0) 50%, 
    rgba(${tint}, 1) 80%
    ),
    url("${getBackgroundImg(`${name}-${period}`)}")
    `;
    overview.style.color = period === "day" ? "black" : "white";
  }

  // #endregion

  // #region Daily Forecast
  forecastDaily.replaceChildren();

  let dayNodes = [];
  data.days.forEach((day) => {
    const container = document.createElement("div");
    container.classList.add("forecast-hourly-entry");

    const dayName = document.createElement("p");
    dayName.textContent = format(parseISO(day.datetime), "EEEE");
    container.append(dayName);

    const icon = document.createElement("img");
    icon.src = getIcon(day.icon);

    container.append(icon);

    const temp = document.createElement("p");
    temp.textContent = day.temp + getUnitSymbol();
    container.append(temp);

    forecastDaily.append(container);
    dayNodes.push({ day: day.datetime, node: container });
  });

  const dayDate = formatInTimeZone(new Date(), data.timezone, "yyyy-MM-dd");

  const todayNode = dayNodes.find((day) => day.day === dayDate).node;
  todayNode.classList.add("forecast-hourly-entry-today");

  todayNode.scrollIntoView({
    behavior: "instant",
    block: "center",
    inline: "center",
  });
  // #endregion
}

function getUnitSymbol() {
  return `°${unitSystem === "metric" ? "C" : "F"}`;
}

overview.style.display = "none";
forecastDailyContainer.style.display = "none";

// overview.style.backgroundImage = `url(${getBackgroundImg("partly-cloudy-day")})`;
