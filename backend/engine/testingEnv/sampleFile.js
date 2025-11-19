// sampleFile.js
export class MyClass {
  constructor(x) {
    this.x = x;
  }
  methodA() {
    console.log(this.x);
  }
}

function helperFunc(y) {
  return y * 2;
}

const arrowFunc = (z) => {
  return z + 1;
};
