const context = import.meta.webpackContext("./icons", {
  recursive: false,
  regExp: /\.svg$/,
});

const icons = {};
context.keys().forEach((key) => {
  const name = key.replace("./", "").replace(".svg", "");
  icons[name] = context(key);
});

export function getIcon(name) {
  if (!Object.hasOwn(icons, name)) {
    if (name.includes("snow")) return icons["snow"];
    else if (name.includes("thunder")) return icons["thunder-rain"];
    else if (name.includes("showers")) return icons["rain"];
  }

  return icons[name];
}
