import React from 'react';
import './index.css';
import logo from '../../images/logo.png';

const FinishPage = () => {
  const versionInfo = 'Milvus 0.10.2';
  const url = '192.168.0.2:19530';

  const onStopMilvusClick = () => {
    console.log('on stop milvus click');
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.send('stopMilvus', versionInfo);
  };

  return (
    <section className="finish-wrapper">
      <img className="finish-img" src={logo} alt="logo" />
      <div className="finish-content">
        <div>{versionInfo}</div>
        <div>is running at</div>
        <div>{url}</div>

        <button onClick={onStopMilvusClick}>Stop Milvus</button>
      </div>
    </section>
  );
};

export default FinishPage;
