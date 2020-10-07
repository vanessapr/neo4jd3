import * as d3 from 'd3';

export const toString = (d) => {
  let s = d.labels ? d.labels[0] : d.type;

  s += ` (<id>:  ${d.id}`;

  Object.keys(d.properties).forEach((property) => {
    s += `, ${property} : ${JSON.stringify(d.properties[property])}`;
  });

  s += ')';

  return s;
};

export const truncateText = (str = '', length = 100) => {
  const ending = '...';

  if (str.length > length) {
    return str.substring(0, length - ending.length) + ending;
  }

  return str;
};

export const rotate = (cx, cy, x, y, angle) => {
  const radians = (Math.PI / 180) * angle;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const nx = (cos * (x - cx)) + (sin * (y - cy)) + cx;
  const ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;

  return { x: nx, y: ny };
};

export const unitaryVector = (source, target, newLength) => {
  const length = Math.sqrt((target.x - source.x) ** 2
    + (target.y - source.y) ** 2) / Math.sqrt(newLength || 1);

  return {
    x: (target.x - source.x) / length,
    y: (target.y - source.y) / length,
  };
};

export const darkenColor = (color) => d3.rgb(color).darker(1);

export const invertColor = (hexColor) => {
  let color = hexColor;

  if (hexColor.indexOf('#') === 0) {
    color = hexColor.slice(1);
  }

  if (color.length === 3) {
    color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
  }

  if (color.length !== 6) {
    throw new Error('Invalid HEX color');
  }

  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);

  return (r * 0.299 + g * 0.587 + b * 0.114) > 186
    ? '#000000'
    : '#FFFFFF';
};
