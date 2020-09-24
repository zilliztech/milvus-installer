import React from 'react';
import './index.css';

const Button = (props) => {
  const { onButtonClick, disabled, label } = props;

  return (
    <button className="button" disabled={!!disabled} onClick={onButtonClick}>
      {label}
    </button>
  );
};

export default Button;
