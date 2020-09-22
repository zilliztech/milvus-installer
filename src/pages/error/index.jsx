import React, { useEffect, useState } from 'react';
import './index.css';
import fail from '../../images/fail.png';
import { useHistory, useLocation } from 'react-router-dom';

const ErrorPage = () => {
  const history = useHistory();
  const location = useLocation();

  const [errorInfo, setErrorInfo] = useState('');

  useEffect(() => {
    const { info } = location.state;
    setErrorInfo(info);
  }, [location]);

  const onRetryButtonClick = () => {
    // back to install page
    history.push('/');
  };

  return (
    <section className="error-wrapper">
      <img className="error-image" src={fail} alt="error" />
      <div className="error-content">
        <div className="error-title">Something went wrong</div>
        <div className="error-info">{errorInfo}</div>
        <button className="error-button" onClick={onRetryButtonClick}>
          Try again
        </button>
      </div>
    </section>
  );
};

export default ErrorPage;
