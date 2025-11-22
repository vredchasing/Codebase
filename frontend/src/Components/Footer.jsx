import './Footer.css'


import { FaFacebook } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FaLinkedin } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa6";





function Footer (){
  return (
    <footer className="main-footer-wrapper">
      <div className='main-footer-inner-wrapper'>
        <div className='footer-column'>
          <div className='footer-column-header'>
            <span className='footer-column-title'>COMPANY</span>
          </div>
          <div className='footer-column-ul'>
            <span className="footer-column-li">About</span>
            <span className="footer-column-li">Security</span>
            <span className="footer-column-li">Terms</span>
            <span className="footer-column-li">Privacy</span>
          </div>
        </div>


        <div className='footer-column'>
          <div className='footer-column-header'>
            <span className='footer-column-title'>FEATURES</span>
          </div>
          <div className='footer-column-ul'>
            <span className="footer-column-li">Agents</span>
            <span className="footer-column-li">RAG Data Engine</span>
            <span className="footer-column-li">Workspace</span>
            <span className="footer-column-li">SDKs</span>
            <span className="footer-column-li">Dashboard</span>
            <span className="footer-column-li">Collections</span>
            <span className="footer-column-li">Explore</span>
            <span className="footer-column-li">Integration</span>
          </div>
        </div>


        <div className='footer-column'>
          <div className='footer-column-header'>
            <span className='footer-column-title'>PRICING</span>
          </div>
          <div className='footer-column-ul'>
            <span className="footer-column-li">Plans</span>
            <span className="footer-column-li">Usage</span>
            <span className="footer-column-li">Policy</span>
            <span className="footer-column-li">Privacy</span>
          </div>
        </div>

        <div className='footer-column'>
          <div className='footer-column-header'>
            <span className='footer-column-title'>RESOURCES</span>
          </div>
          <div className='footer-column-ul'>
            <span className="footer-column-li">Blog</span>
            <span className="footer-column-li">Contact Us</span>
            <span className="footer-column-li">Documentation</span>
            <span className="footer-column-li">Guides</span>
            <span className="footer-column-li">Request Features</span>
            <span className="footer-column-li">Community</span>
          </div>
        </div>

        <div className='footer-column'>
          <div className='footer-column-header'>
            <span className='footer-column-title'>FOLLOW US</span>
          </div>
          <div className='footer-column-ul'>
            <FaXTwitter size={20} color='gray'></FaXTwitter>
            <FaInstagram size={20} color='gray'></FaInstagram>
            <FaFacebook size={20} color='gray'></FaFacebook>
            <FaLinkedin size={20} color='gray'></FaLinkedin>
          </div>
        </div>
      </div>
      <div className='footer-bottom-wrapper'>
        <div className='footer-bottom-inner-wrapper'>
          <div className='footer-bottom-left'>
            <span className='footer-bottom-span'>
              Copyright © 2025 Codebase, Inc. All rights reserved.
            </span>
          </div>
          <div className='footer-bottom-right'>
            <span className='footer-bottom-span'>
              Terms of Use & Privacy Policy
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;