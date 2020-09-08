const { ipcRenderer } = require("electron");

window.addEventListener("load", () => {
  const btn = document.querySelector(".install-btn");
  const progress = document.querySelector(".install-progress");
  btn.addEventListener("click", () => {
    // ipcRenderer.invoke("perform-action", ["install"]);
    ipcRenderer.send("installMilvus", "start");
    // let reply = ipcRenderer.sendSync("helloSync", "a string", 10);
    // console.log(reply);
  });

  ipcRenderer.on("installMilvusProgress", (event, args) => {
    progress.value = `${args}\n\r${progress.value}`;
  });

  ipcRenderer.on("installMilvusDone", (event, args) => {
    progress.value = `${args}\n\r${progress.value}`;
  });
});
