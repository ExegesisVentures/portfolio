import { useState } from 'react';
import { useWalletData } from '../hooks/useWalletData';
import TransactionHistory from './TransactionHistory';

interface WalletDetailViewProps {
  wallet: {
    id: number;
    blockchain?: string;
    address: string;
    label: string | null;
    is_favorite: boolean;
    user_id: string;
  } | null;
}

// Helper function to determine blockchain based on address pattern
const determineBlockchain = (address: string): string => {
  // XRP addresses typically start with 'r' and are 25-35 characters long
  if (address.startsWith('r') && address.length >= 25 && address.length <= 35) {
    return 'XRP';
  } 
  // Coreum addresses typically start with 'core' and are about 44-45 characters
  else if (address.startsWith('core')) {
    return 'COREUM';
  }
  // If neither pattern matches, try to make a best guess
  else {
    console.warn('Unable to definitively determine blockchain from address pattern:', address);
    return address.startsWith('r') ? 'XRP' : 'COREUM';
  }
};

const WalletDetailView = ({ wallet }: WalletDetailViewProps) => {
  const [activeTab, setActiveTab] = useState('balance');
  
  // If wallet exists, use its blockchain property or determine it from the address
  const blockchainType = wallet ? (wallet.blockchain || determineBlockchain(wallet.address)) : '';
  
  const { balances, totalValue, loading, error } = useWalletData(
    blockchainType,
    wallet?.address || ''
  );

  if (!wallet) {
    return (
      <div className="wallet-detail-view">
        <div className="no-wallet-selected">
          Please select a wallet to view details.
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <div className="wallet-detail-view">
      <div className="wallet-tabs">
        <div 
          className={`wallet-tab ${activeTab === 'balance' ? 'active' : ''}`}
          onClick={() => setActiveTab('balance')}
        >
          Balance
        </div>
        <div 
          className={`wallet-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </div>
        <div 
          className={`wallet-tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Wallet Info
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'balance' && (
          <div className="balance-tab">
            <div className="wallet-details">
              <div className="wallet-detail-item">
                <span className="detail-label">Label:</span>
                <span className="detail-value">{wallet.label || 'Unlabeled Wallet'}</span>
              </div>
              <div className="wallet-detail-item">
                <span className="detail-label">Blockchain:</span>
                <span className="detail-value">{blockchainType}</span>
              </div>
              <div className="wallet-detail-item">
                <span className="detail-label">Address:</span>
                <span className="detail-value address-value">{wallet.address}</span>
              </div>
            </div>

            {loading ? (
              <div className="loading">Loading balances...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <>
                <div className="crypto-balances">
                  <div className="balances-header">
                    <div className="balance-col">Asset</div>
                    <div className="balance-col">Balance</div>
                    <div className="balance-col">Value</div>
                    <div className="balance-col">Price (24h)</div>
                  </div>
                  
                  {balances.length === 0 ? (
                    <div className="empty-balances">No crypto assets found in this wallet.</div>
                  ) : (
                    balances.map((crypto) => (
                      <div key={crypto.symbol} className="balance-row">
                        <div className="balance-col asset-col">
                          <div className="asset-symbol">{crypto.symbol}</div>
                          <div className="asset-name">{crypto.name}</div>
                        </div>
                        <div className="balance-col">
                          {crypto.balance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6
                          })}
                        </div>
                        <div className="balance-col">
                          {formatCurrency(crypto.value_usd)}
                        </div>
                        <div className="balance-col price-col">
                          <div>{crypto.price_usd > 0 ? formatCurrency(crypto.price_usd) : "N/A"}</div>
                          {crypto.price_change_24h !== 0 && (
                            <div className={`price-change ${crypto.price_change_24h >= 0 ? 'positive' : 'negative'}`}>
                              {crypto.price_change_24h >= 0 ? '+' : ''}{crypto.price_change_24h.toFixed(2)}%
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  
                  {balances.length > 0 && (
                    <div className="total-balance">
                      <span>Total Value:</span>
                      <span>{formatCurrency(totalValue)}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="transactions-tab">
            <TransactionHistory 
              blockchain={blockchainType} 
              address={wallet.address} 
            />
          </div>
        )}

        {activeTab === 'info' && (
          <div className="info-tab">
            <h3>Wallet Information</h3>
            
            <div className="info-content">
              <div className="info-group">
                <h4>Blockchain Details</h4>
                {blockchainType === 'COREUM' && (
                  <div className="blockchain-info">
                    <p><strong>Network:</strong> Coreum Mainnet</p>
                    <p><strong>Explorer:</strong> <a href={`https://explorer.mainnet.coreum.dev/coreum/accounts/${wallet.address}`} target="_blank" rel="noopener noreferrer">View on Explorer</a></p>
                    <p><strong>Type:</strong> Cosmos SDK Based Chain</p>
                    <p><strong>Features:</strong> Smart Contracts, Token Issuance, Staking</p>
                  </div>
                )}
                
                {blockchainType === 'XRP' && (
                  <div className="blockchain-info">
                    <p><strong>Network:</strong> XRP Ledger Mainnet</p>
                    <p><strong>Explorer:</strong> <a href={`https://xrpscan.com/account/${wallet.address}`} target="_blank" rel="noopener noreferrer">View on Explorer</a></p>
                    <p><strong>Type:</strong> XRP Ledger</p>
                    <p><strong>Features:</strong> Fast finality, Low fees, DEX</p>
                  </div>
                )}
              </div>
              
              <div className="info-group">
                <h4>Security Tips</h4>
                <ul className="security-tips">
                  <li>Never share your private keys</li>
                  <li>Double-check addresses before sending transactions</li>
                  <li>Use hardware wallets for large balances</li>
                  <li>Enable two-factor authentication where available</li>
                  <li>Keep your software and devices updated</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletDetailView; 