import React from 'react';
import InstallationPage from './pages/installation';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { CONFIG_ROUTE, ERROR_ROUTE, INSTALL_ROUTE } from './shared/constants';
import ConfigurationPage from './pages/configuration';
import ErrorPage from './pages/error';

function App() {
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
    </>
  );
}

export default App;
