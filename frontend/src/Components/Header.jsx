import { Link } from "react-router-dom";

function Header (){
  return(
    <header className="header">
      <div className="header-content">
        <div className="custom-logo-container">
          <img className= 'square' src="\public\images\square-logo.png"></img>
          <p className="logo-c">C</p>
        </div>

        <div className="header-center-nav">
          <Link to="/workspace" className="header-link">Workspace</Link>
          <Link to="/" className="header-link">Collections</Link>
          <Link to="/" className="header-link">Explore</Link>
          <Link to="/" className="header-link">Support</Link>
          <Link to="/" className="header-link">Docs</Link>
        </div> 

        <div className="header-right-nav">
          <Link to="/signin" className="header-link">Sign In</Link>
          <Link to="/signup" className="header-link-try-for-free">Try for free</Link>
        </div>

      </div>
    </header>

  )
}
export default Header;