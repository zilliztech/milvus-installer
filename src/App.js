import React from 'react';
import InstallationPage from './pages/installation';

function App() {
  // const { ipcRenderer } = window.require('electron');

  // window.addEventListener('load', () => {
  //   const btn = document.querySelector('.install-btn');
  //   const progress = document.querySelector('.install-progress');
  //   btn.addEventListener('click', () => {
  //     // ipcRenderer.invoke("perform-action", ["install"]);
  //     ipcRenderer.send('installMilvus', 'start');
  //     // let reply = ipcRenderer.sendSync("helloSync", "a string", 10);
  //     // console.log(reply);
  //   });

  //   ipcRenderer.on('installMilvusProgress', (event, args) => {
  //     progress.value = `${args}\n\r${progress.value}`;
  //   });

  //   ipcRenderer.on('installMilvusDone', (event, args) => {
  //     progress.value = `${args}\n\r${progress.value}`;
  //   });
  // });

  return (
    <>
      {/* <h1>Milvus 0.10.2 Installer</h1>
      <button className="install-btn">Install Milvus</button>
      <div>
        <textarea
          className="install-progress"
          style={{ width: '600px', height: '600px' }}
        ></textarea>
      </div> */}
      <InstallationPage />
    </>
  );
}

export default App;
