import React from "react";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">FoodOrder 😋</div>
        <div className="footer-copy">
          Mithanshu © {new Date().getFullYear()} FoodOrder. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
