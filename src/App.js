import React from 'react';
import InstallationPage from './pages/installation';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { CONFIG_ROUTE, ERROR_ROUTE, INSTALL_ROUTE } from './shared/constants';
import ConfigurationPage from './pages/configuration';
import ErrorPage from './pages/error';

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
      <Router>
        <Switch>
          <Route exact path={INSTALL_ROUTE}>
            <InstallationPage />
          </Route>
          <Route path={CONFIG_ROUTE}>
            <ConfigurationPage />
          </Route>
          <Route path={ERROR_ROUTE}>
            <ErrorPage />
          </Route>
        </Switch>
      </Router>
      {/* <h1>Milvus 0.10.2 Installer</h1>
      <button className="install-btn">Install Milvus</button>
      <div>
        <textarea
          className="install-progress"
          style={{ width: '600px', height: '600px' }}
        ></textarea>
      </div> */}
    </>
  );
}

export default App;
