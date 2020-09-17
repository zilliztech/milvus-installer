import React, { useEffect, useState } from 'react';
import loader from '../../images/loader.png';
import './index.css';
// import { ipcRenderer } from 'electron';

const getInstallationHintMap = () => {
  const map = {
    checking: 'checking environment',
    checked: 'checked',
    installing: 'installing',
    installed: 'installed',
  };

  return map;
};

const detectNetwork = () => {
  // use baidu to test network
  fetch('www.baidu.com')
    // .then(() => {
    //   // console.log('connected');
    // })
    .catch((e) => {
      alert('There is something wrong with your Internet');
    });
};

const InstallationPage = () => {
  // checking, checked, installing, installed
  const [installStatus, setInstallStatus] = useState('checking');
  const hintMap = getInstallationHintMap();

  useEffect(() => {
    window.addEventListener('offline', detectNetwork);
    window.addEventListener('online', detectNetwork);

    return () => {
      window.removeEventListener('offline', detectNetwork);
      window.removeEventListener('online', detectNetwork);
    };
  }, []);

  return (
    <section className="install-wrapper">
      <div>
        <img className="install-img" src={loader} alt="loader" />
      </div>

      <div className="install-content">
        <div>
          <div className="install-title">Milvus Launcher</div>
          <div className="install-hint">{hintMap[installStatus]}</div>
        </div>

        <button className="install-button">install</button>
      </div>
    </section>
  );
};

export default InstallationPage;
