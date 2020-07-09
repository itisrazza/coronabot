
function a(b, c) {
    console.log(this);
    console.log({ b, c });
}

var ab = a.bind(null, 1);
ab(420);

var obj = { width: 40, height: 40 };
var ab2 = ab.bind(null, 69);
ab2();
