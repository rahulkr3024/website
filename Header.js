import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <h1>Quicky Analyzer</h1>
            <span className="tagline">AI-Powered Content Analysis</span>
          </div>
          
          <nav className="nav">
            <a href="#features" className="nav-link">Features</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#contact" className="nav-link">Contact</a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;