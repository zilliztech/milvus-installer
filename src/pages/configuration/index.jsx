import {
  CircularProgress,
  IconButton,
  InputAdornment,
  makeStyles,
  TextField,
} from '@material-ui/core';
import React, { useState } from 'react';
import DeleteIcon from '@material-ui/icons/Delete';

import Button from '../../components/button';
import logo from '../../images/logo.png';
import folderIcon from '../../images/icon-folder.svg';
import './index.css';
import { useHistory } from 'react-router-dom';
import {
  checkStorage,
  getStorage,
  setStorage,
} from '../../shared/storage.util';
import { STORAGE_CONFIGS } from '../../shared/constants';
import Alert from '../../components/alert';

const useStyles = makeStyles({
  root: {
    '& label.Mui-focused': {
      color: '#4fc4f9',
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: '#4fc4f9',
    },
  },
  loading: {
    color: '#4fc4f9',
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -24,
    marginLeft: -24,
  },
  icon: {
    color: 'rgba(0, 0, 0, 0.2)',
  },
});

const getConfigInput = () => {
  const configs = [
    {
      label: 'Milvus port',
      value: 19530,
      type: 'milvus/port',
      needPathIcon: false,
    },
    {
      label: 'Http port',
      value: 19121,
      type: 'milvus/httpPort',
      needPathIcon: false,
    },
    {
      label: 'Data directory',
      value: '',
      type: 'milvus/db',
      needPathIcon: true,
    },
    {
      label: 'Config directory',
      value: '',
      type: 'milvus/conf',
      needPathIcon: true,
    },
    {
      label: 'Log directory',
      value: '',
      type: 'milvus/logs',
      needPathIcon: true,
    },
    {
      label: 'Wal directory',
      value: '',
      type: 'milvus/wal',
      needPathIcon: true,
    },
  ];

  return configs;
};

const getItemFromConfig = (type, value) => {
  const configCommandMap = {
    'milvus/port': {
      '19530/tcp': [
        {
          HostPort: `${value}`,
        },
      ],
    },
    'milvus/httpPort': {
      '19121/tcp': [
        {
          HostPort: `${value}`,
        },
      ],
    },
    'milvus/db': `${value}:/var/lib/milvus/db`,
    'milvus/conf': `${value}:/var/lib/milvus/conf`,
    'milvus/logs': `${value}:/var/lib/milvus/logs`,
    'milvus/wal': `${value}:/var/lib/milvus/wal`,
  };

  return configCommandMap[type];
};

const getCreateOption = (configs, version) => {
  const [, ver] = version.split(' ');
  let createConfig = {
    name: `milvus_cpu_${ver}`,
    ExposedPorts: {
      '19530/tcp': {},
      '19121/tcp': {},
    },

    HostConfig: {
      PortBindings: {},
      Binds: [],
    },
  };

  if (version.includes('GPU')) {
    createConfig = {
      ...createConfig,
      gpus: 'all',
      name: `milvus_gpu_${ver}`,
    };
  }

  configs.forEach((config) => {
    const newConfig = getItemFromConfig(config.type, config.value);
    const portsTypes = ['milvus/port', 'milvus/httpPort'];
    if (portsTypes.includes(config.type)) {
      createConfig = {
        ...createConfig,
        HostConfig: {
          PortBindings: {
            ...createConfig.HostConfig.PortBindings,
            ...newConfig,
          },
          Binds: [...createConfig.HostConfig.Binds],
        },
      };
    } else {
      createConfig = {
        ...createConfig,
        HostConfig: {
          PortBindings: {
            ...createConfig.HostConfig.PortBindings,
          },
          Binds: newConfig
            ? [...createConfig.HostConfig.Binds, newConfig]
            : [...createConfig.HostConfig.Binds],
        },
      };
    }
  });

  return createConfig;
};

const ConfigurationPage = () => {
  const { ipcRenderer } = window.require('electron');
  const classes = useStyles();
  const [configs, setConfigs] = useState(
    checkStorage(STORAGE_CONFIGS)
      ? getStorage(STORAGE_CONFIGS)
      : getConfigInput()
  );
  const [showLoading, setShowLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);
  const history = useHistory();
  const version = ipcRenderer.sendSync('getMilvusVersion', 'start');

  const checkConfigExistence = (configs) => {
    const configItem = configs.find((config) => config.type === 'milvus/conf');
    if (!configItem) {
      return true;
    }
    return ipcRenderer.sendSync('checkFileExistence', configItem.value);
  };

  const checkPorts = (configs) => {
    const validTypes = configs.map((config) => config.type);
    return (
      validTypes.includes('milvus/port') &&
      validTypes.includes('milvus/httpPort')
    );
  };

  const onStartButtonClick = () => {
    const validConfigs = configs.filter((config) => config.value);
    const isConfigValid = checkConfigExistence(validConfigs);
    const isPortsValid = checkPorts(validConfigs);

    if (isConfigValid && isPortsValid) {
      const createConfig = getCreateOption(validConfigs, version);

      ipcRenderer.send('startMilvus', createConfig);
      setShowLoading(true);
      monitorStartMilvus();

      // save configs
      setStorage(STORAGE_CONFIGS, configs);
    } else if (!isConfigValid) {
      setAlertInfo({
        content: `Please download server_config.yaml file manually to config directory before start`,
      });
    } else if (!isPortsValid) {
      setAlertInfo({
        content: 'Please enter Milvus port and Http port first',
      });
    }
  };

  const onFileIconClick = (config) => {
    ipcRenderer.send('openFolder', config);
    monitorFileSelect();
  };

  const monitorFileSelect = () => {
    ipcRenderer.on('dirSelectDone', (event, config) => {
      const newConfigs = configs.map((c) =>
        c.type !== config.type ? c : config
      );

      setConfigs(newConfigs);
    });

    ipcRenderer.on('dirSelectError', (event, errorInfo) => {
      history.push({
        pathname: '/error',
        state: {
          info: errorInfo,
        },
      });
    });

    ipcRenderer.on('moveFileError', (event, path) => {
      setAlertInfo({
        content: `Fail to download configuration file to ${path}, please download server_config.yaml file manually to this folder`,
      });
    });
  };

  const monitorStartMilvus = () => {
    ipcRenderer.on('startMilvusDone', (event, isDone) => {
      if (isDone) {
        setShowLoading(false);
        // move to finish page
        history.push('/finish');
      }
    });

    ipcRenderer.on('startMilvusError', (event, errInfo) => {
      setShowLoading(false);
      // move to err page
      history.push({
        pathname: '/error',
        state: {
          info: errInfo,
        },
      });
    });
  };

  const onInputChange = (event, config) => {
    const value = event.target.value;
    config.value = value;
  };

  const onAlertClose = () => {
    setAlertInfo(null);
  };

  const onFileClearClick = (config) => {
    const newConfigs = configs.map((c) =>
      c.type !== config.type ? c : { ...config, value: '' }
    );

    setConfigs(newConfigs);
  };

  return (
    <section className="config-wrapper">
      <Alert
        open={alertInfo !== null}
        onClose={onAlertClose}
        content={alertInfo && alertInfo.content}
      />
      <img className="config-image" src={logo} alt="logo" />
      <div className="config-main">
        <h2 className="config-title">Configuration</h2>
        <form className="config-form">
          {configs.map((config) => (
            <div className="config-input" key={config.label}>
              {config.needPathIcon ? (
                <TextField
                  className={classes.root}
                  label={config.label}
                  fullWidth
                  value={config.value}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => {
                            onFileIconClick(config);
                          }}
                        >
                          <img src={folderIcon} alt="foler icon" />
                        </IconButton>

                        <IconButton
                          onClick={() => {
                            onFileClearClick(config);
                          }}
                        >
                          <DeleteIcon
                            fontSize="small"
                            className={classes.icon}
                          />
                        </IconButton>
                      </InputAdornment>
                    ),
                    readOnly: true,
                  }}
                />
              ) : (
                <TextField
                  className={classes.root}
                  label={config.label}
                  defaultValue={config.value}
                  onChange={(event) => onInputChange(event, config)}
                />
              )}
            </div>
          ))}
        </form>

        <Button
          label="Start Milvus"
          disabled={showLoading}
          onButtonClick={onStartButtonClick}
        />
        {showLoading && (
          <CircularProgress size={48} className={classes.loading} />
        )}
      </div>
    </section>
  );
};

export default ConfigurationPage;
