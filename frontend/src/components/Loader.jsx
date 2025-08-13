import React from "react";

const Loader = ({ text = "Loading..." }) => {
  return (
    <span className="row" role="status" aria-live="polite">
      <span className="spinner" />
      <span className="menu-sub">{text}</span>
    </span>
  );
};

export default Loader;
