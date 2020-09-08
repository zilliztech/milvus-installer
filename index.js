var Docker = require("dockerode");
var docker = new Docker({ socketPath: "/var/run/docker.sock" });

console.log("start pulling");

const repoTag = "milvusdb/milvus:0.10.2-cpu-d081520-8a2393";
//followProgress(stream, onFinished, [onProgress])
docker.pull(repoTag, function (err, stream) {
  //...
  docker.modem.followProgress(stream, onFinished, onProgress);

  function onFinished(err, output) {
    console.log("on finished", output);
    //output is an array with output json parsed objects
    //...
  }
  function onProgress(event) {
    console.log("on progress", event);
    //...
  }
});
