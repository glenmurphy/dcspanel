function trace() {
  try {
    throw new Error('myError');
  }
  catch(e) {
    return e.stack.split("\n");
  }
}

export default function log(t) {
  console.log((Date.now() / 1000) + ': ' + t);
}