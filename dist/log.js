function trace() {
  try {
    throw new Error('myError');
  }
  catch(e) {
    return e.stack.split("\n");
  }
}

let start = 0;

export default function log(txt) {
  const t = Date.now();
  if (start == 0) {
    start = t;
  }
  const display = ((t - start) / 1000).toFixed(3);
  console.log(display + ': ' + txt);
}