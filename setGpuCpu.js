let fs = require("fs");

const name = process.argv[2];

function changePackageJson(name) {
  //现将json文件读出来
  fs.readFile("./package.json", function (err, data) {
    if (err) {
      return console.error(err);
    }
    let packageJson = data.toString();
    try {
      packageJson = JSON.parse(packageJson);
      packageJson.build.appId = name;
      packageJson.name = name;

      const str = JSON.stringify(packageJson);
      fs.writeFile("./package.json", str, function (err) {
        if (err) {
          console.error(err);
        }
        console.log("----------Change package.json success-------------");
      });
    } catch (e) {
      console.error("changePackageJson parse error");
    }
  });
}

function changeTag(name) {
  const path = "./public/repo_tag.json";
  fs.readFile(path, function (err, data) {
    if (err) {
      return console.error(err);
    }
    try {
      let repoTag = data.toString();
      repoTag = JSON.parse(repoTag);
      repoTag.current = name.includes("cpu") ? repoTag.cpu : repoTag.gpu;

      const str = JSON.stringify(repoTag);
      fs.writeFile(path, str, function (err) {
        if (err) {
          console.error(err);
        }
        console.log("----------Change repo_tag.json success-------------");
      });
    } catch (e) {
      console.error("changeTag parse error");
    }
  });
}

changePackageJson(name);
changeTag(name);
