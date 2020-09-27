let fs = require("fs");

function writeJson(name) {
  //现将json文件读出来
  fs.readFile("./package.json", function (err, data) {
    if (err) {
      return console.error(err);
    }
    let packageJson = data.toString(); //将二进制的数据转换为字符串
    packageJson = JSON.parse(packageJson); //将字符串转换为json对象
    packageJson.build.appId = name;
    const str = JSON.stringify(packageJson); //因为nodejs的写入文件只认识字符串或者二进制数，所以把json对象转换成字符串重新写入json文件中
    fs.writeFile("./package.json", str, function (err) {
      if (err) {
        console.error(err);
      }
      console.log("----------Change success-------------");
    });
  });
}
writeJson(process.argv[2]); //执行一下;
