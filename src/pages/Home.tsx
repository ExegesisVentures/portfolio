import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>CryptoWallet Viewer</h1>
        <p>A secure platform to view and monitor your cryptocurrency holdings across multiple blockchains</p>
        
        <div className="cta-buttons">
          {user ? (
            <Link to="/dashboard" className="primary-button">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="primary-button">
                Login
              </Link>
              <Link to="/register" className="secondary-button">
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="features-section">
        <div className="feature">
          <h2>Multi-Chain Support</h2>
          <p>View wallets across Coreum and XRP Ledger blockchains with a single dashboard</p>
        </div>
        
        <div className="feature">
          <h2>Real-Time Prices</h2>
          <p>Get up-to-date cryptocurrency prices and portfolio valuation via CoinGecko</p>
        </div>
        
        <div className="feature">
          <h2>Secure Access</h2>
          <p>Your private keys never leave your device - we only use public addresses</p>
        </div>
      </div>

      <div className="blockchain-section">
        <h2>Supported Blockchains</h2>
        <div className="blockchain-cards">
          <div className="blockchain-card coreum">
            <div className="blockchain-logo">
              <span className="icon">C</span>
            </div>
            <h3>Coreum</h3>
            <p>A 3rd generation blockchain built for financial use cases and enterprise solutions</p>
            <a href="https://www.coreum.com/" target="_blank" rel="noopener noreferrer" className="learn-more">
              Learn more
            </a>
          </div>
          
          <div className="blockchain-card xrp">
            <div className="blockchain-logo">
              <span className="icon">X</span>
            </div>
            <h3>XRP Ledger</h3>
            <p>A decentralized cryptographic ledger powered by a network of peer-to-peer servers</p>
            <a href="https://xrpl.org/" target="_blank" rel="noopener noreferrer" className="learn-more">
              Learn more
            </a>
          </div>
        </div>
      </div>

      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        
        <div className="faq-item">
          <h3>Is this application secure?</h3>
          <p>Yes, we never store your private keys. We only use public addresses to view balance information.</p>
        </div>
        
        <div className="faq-item">
          <h3>How do I add a wallet?</h3>
          <p>After logging in, navigate to the dashboard and use the "Add Wallet" form to input your public address.</p>
        </div>
        
        <div className="faq-item">
          <h3>Is there a limit to how many wallets I can track?</h3>
          <p>No, you can add as many wallet addresses as you need to monitor your crypto assets.</p>
        </div>
        
        <div className="faq-item">
          <h3>How frequently is price data updated?</h3>
          <p>Price data is updated in real-time when you view your dashboard, pulling the latest information from CoinGecko's API.</p>
        </div>
      </div>
    </div>
  );
};

export default Home; 