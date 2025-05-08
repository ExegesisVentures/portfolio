import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { query } from '../lib/database';
import WalletDetailView from '../components/WalletDetailView';

interface WalletAddress {
  id: number;
  address: string;
  label: string | null;
  is_favorite: boolean;
  user_id: string;
  // Keeping track of blockchain type in the client without storing it in DB
  blockchain?: string;
}

interface CryptoBalance {
  symbol: string;
  name: string;
  balance: number;
  value_usd: number;
  price_usd: number;
  price_change_24h: number;
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletAddress | null>(null);
  const [cryptoBalances] = useState<CryptoBalance[]>([]);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletChain, setNewWalletChain] = useState('COREUM');
  const [newWalletLabel, setNewWalletLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Supported blockchains
  const blockchains = [
    { id: 'COREUM', name: 'Coreum' },
    { id: 'XRP', name: 'XRP Ledger' },
  ];

  useEffect(() => {
    if (user) {
      fetchWalletAddresses();
    }
  }, [user]);

  const fetchWalletAddresses = async () => {
    setLoading(true);
    try {
      const result = await query(
        'SELECT * FROM wallet_addresses WHERE user_id = $1 ORDER BY is_favorite DESC, created_at DESC',
        [user?.id]
      );
      // Add a default blockchain for display purposes only
      const walletsWithBlockchain = result.rows.map(wallet => ({
        ...wallet,
        blockchain: determineBlockchain(wallet.address)
      }));
      setWalletAddresses(walletsWithBlockchain);
    } catch (err) {
      console.error('Error fetching wallet addresses:', err);
      setError('Failed to load your wallet addresses');
    } finally {
      setLoading(false);
    }
  };

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

  const addWalletAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletAddress.trim()) return;
    
    try {
      // Determine the blockchain based on the address format
      const detectedBlockchain = determineBlockchain(newWalletAddress);
      
      // If the detected blockchain is different from user's selection, use the detected one
      const actualBlockchain = detectedBlockchain;
      
      // If we detect a specific blockchain that's different from what user selected, log a warning
      if (detectedBlockchain !== newWalletChain) {
        console.warn(`Address format suggests ${detectedBlockchain} but user selected ${newWalletChain}. Using ${actualBlockchain}.`);
      }
      
      const result = await query(
        'INSERT INTO wallet_addresses (address, label, is_favorite, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [newWalletAddress, newWalletLabel || null, walletAddresses.length === 0, user?.id]
      );
      
      // Add the blockchain type (frontend-only) based on detection
      const newWallet = {
        ...result.rows[0],
        blockchain: actualBlockchain
      };
      
      setWalletAddresses([...walletAddresses, newWallet]);
      
      // If this is the first wallet, select it
      if (walletAddresses.length === 0) {
        setSelectedWallet(newWallet);
      }
      
      // Reset form
      setNewWalletAddress('');
      setNewWalletLabel('');
    } catch (err) {
      console.error('Error adding wallet address:', err);
      setError('Failed to add wallet address');
    }
  };

  const toggleFavorite = async (id: number, isFavorite: boolean) => {
    try {
      const result = await query(
        'UPDATE wallet_addresses SET is_favorite = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        [!isFavorite, id, user?.id]
      );
      
      if (result.rows.length > 0) {
        setWalletAddresses(walletAddresses.map(wallet => 
          wallet.id === id ? { ...wallet, is_favorite: !isFavorite } : wallet
        ));
      }
    } catch (err) {
      console.error('Error updating wallet:', err);
      setError('Failed to update wallet');
    }
  };

  const deleteWalletAddress = async (id: number) => {
    try {
      await query(
        'DELETE FROM wallet_addresses WHERE id = $1 AND user_id = $2',
        [id, user?.id]
      );
      
      const updatedWallets = walletAddresses.filter(wallet => wallet.id !== id);
      setWalletAddresses(updatedWallets);
      
      // If the deleted wallet was selected, select a different one
      if (selectedWallet?.id === id) {
        setSelectedWallet(updatedWallets.length > 0 ? updatedWallets[0] : null);
      }
    } catch (err) {
      console.error('Error deleting wallet address:', err);
      setError('Failed to delete wallet address');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Crypto Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.email}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>

      <div className="wallet-section">
        <div className="wallet-list-container">
          <h2>Your Wallets</h2>
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={addWalletAddress} className="wallet-form">
            <div className="form-row">
              <select 
                value={newWalletChain}
                onChange={(e) => setNewWalletChain(e.target.value)}
                className="chain-select"
              >
                {blockchains.map(chain => (
                  <option key={chain.id} value={chain.id}>
                    {chain.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newWalletAddress}
                onChange={(e) => setNewWalletAddress(e.target.value)}
                placeholder="Wallet address..."
                className="wallet-input"
              />
            </div>
            <div className="form-row">
              <input
                type="text"
                value={newWalletLabel}
                onChange={(e) => setNewWalletLabel(e.target.value)}
                placeholder="Label (optional)"
                className="label-input"
              />
              <button type="submit" className="add-button">Add Wallet</button>
            </div>
          </form>

          {loading ? (
            <div className="loading">Loading your wallets...</div>
          ) : (
            <ul className="wallet-list">
              {walletAddresses.length === 0 ? (
                <li className="empty-list">No wallets added yet. Add one above.</li>
              ) : (
                walletAddresses.map((wallet) => (
                  <li 
                    key={wallet.id} 
                    className={`wallet-item ${selectedWallet?.id === wallet.id ? 'selected' : ''}`}
                    onClick={() => setSelectedWallet(wallet)}
                  >
                    <div className="wallet-content">
                      <div className="wallet-header">
                        <span className="wallet-chain">{wallet.blockchain || determineBlockchain(wallet.address)}</span>
                        <div className="wallet-actions">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(wallet.id, wallet.is_favorite);
                            }} 
                            className="favorite-button"
                            title={wallet.is_favorite ? "Remove from favorites" : "Add to favorites"}
                          >
                            {wallet.is_favorite ? "★" : "☆"}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteWalletAddress(wallet.id);
                            }} 
                            className="delete-button"
                            title="Delete wallet"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <div className="wallet-label">
                        {wallet.label || "Unlabeled Wallet"}
                      </div>
                      <div className="wallet-address">
                        {wallet.address.substring(0, 10)}...{wallet.address.substring(wallet.address.length - 10)}
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        <div className="balance-container">
          <WalletDetailView wallet={selectedWallet} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 