const context = import.meta.webpackContext("./images", {
  recursive: false,
  regExp: /\.avif$/,
});

const images = {};
context.keys().forEach((key) => {
  const name = key.replace("./", "").replace(".avif", "");
  images[name] = context(key);
});

export function getBackgroundImg(name) {
  return images[name];
}
