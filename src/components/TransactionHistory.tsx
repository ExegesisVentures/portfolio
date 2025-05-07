import { useState, useEffect } from 'react';
import * as coreumService from '../services/coreumService';
import * as xrpService from '../services/xrpService';

interface TransactionHistoryProps {
  blockchain: string;
  address: string;
}

interface Transaction {
  hash: string;
  timestamp: string;
  type: string;
  from: string;
  to: string;
  amount: string;
  symbol: string;
  status: string;
}

const TransactionHistory = ({ blockchain, address }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (blockchain === 'COREUM') {
          await fetchCoreumTransactions(address);
        } else if (blockchain === 'XRP') {
          await fetchXrpTransactions(address);
        } else {
          throw new Error(`Unsupported blockchain: ${blockchain}`);
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [blockchain, address, page]);

  const fetchCoreumTransactions = async (address: string) => {
    const txResponse = await coreumService.getTransactionHistory(address, pageSize);
    
    if (!txResponse.txs || txResponse.txs.length === 0) {
      setTransactions([]);
      return;
    }
    
    const formattedTransactions = txResponse.txs.map((tx: any) => {
      // Extract the first message from the transaction
      const message = tx.tx.body.messages[0];
      const isOutgoing = message.from_address === address;
      const amount = message.amount && message.amount.length > 0 
        ? message.amount[0] 
        : { amount: '0', denom: '' };
      
      const denom = amount.denom || '';
      const symbol = denom === 'ucore' ? 'CORE' : denom.toUpperCase();
      const amountValue = denom === 'ucore' 
        ? (parseInt(amount.amount) / 1000000).toString() 
        : amount.amount;
      
      return {
        hash: tx.hash,
        timestamp: tx.timestamp,
        type: message['@type'].split('.').pop() || 'Unknown',
        from: message.from_address || 'Unknown',
        to: message.to_address || 'Unknown',
        amount: amountValue,
        symbol,
        status: tx.tx_result?.code === 0 ? 'Success' : 'Failed'
      };
    });
    
    setTransactions(formattedTransactions);
  };

  const fetchXrpTransactions = async (address: string) => {
    const txResponse = await xrpService.getTransactionHistory(address, pageSize);
    
    if (!txResponse.result || !txResponse.result.transactions || txResponse.result.transactions.length === 0) {
      setTransactions([]);
      return;
    }
    
    const formattedTransactions = txResponse.result.transactions.map((tx: any) => {
      const isOutgoing = tx.tx.Account === address;
      
      return {
        hash: tx.tx.hash,
        timestamp: new Date(tx.tx.date * 1000 + 946684800000).toISOString(), // Convert Ripple epoch to ISO
        type: tx.tx.TransactionType,
        from: tx.tx.Account,
        to: tx.tx.Destination || 'N/A',
        amount: (parseInt(tx.tx.Amount) / 1000000).toString(),
        symbol: 'XRP',
        status: tx.meta.TransactionResult === 'tesSUCCESS' ? 'Success' : 'Failed'
      };
    });
    
    setTransactions(formattedTransactions);
  };

  const handlePrevPage = () => {
    setPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setPage(prev => prev + 1);
  };

  const formatAddress = (address: string) => {
    if (!address || address === 'Unknown' || address === 'N/A') return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return <div className="transaction-loading">Loading transactions...</div>;
  }

  if (error) {
    return <div className="transaction-error">Error: {error}</div>;
  }

  return (
    <div className="transaction-history">
      <h3>Transaction History</h3>
      
      {transactions.length === 0 ? (
        <div className="no-transactions">No transactions found</div>
      ) : (
        <>
          <div className="transaction-table">
            <div className="transaction-header">
              <div className="tx-col tx-hash">Hash</div>
              <div className="tx-col tx-date">Date</div>
              <div className="tx-col tx-type">Type</div>
              <div className="tx-col tx-from">From</div>
              <div className="tx-col tx-to">To</div>
              <div className="tx-col tx-amount">Amount</div>
              <div className="tx-col tx-status">Status</div>
            </div>
            
            {transactions.map((tx, index) => (
              <div key={index} className="transaction-row">
                <div className="tx-col tx-hash" title={tx.hash}>
                  {formatAddress(tx.hash)}
                </div>
                <div className="tx-col tx-date">
                  {formatDate(tx.timestamp)}
                </div>
                <div className="tx-col tx-type">
                  {tx.type}
                </div>
                <div className="tx-col tx-from" title={tx.from}>
                  {formatAddress(tx.from)}
                </div>
                <div className="tx-col tx-to" title={tx.to}>
                  {formatAddress(tx.to)}
                </div>
                <div className="tx-col tx-amount">
                  {tx.amount} {tx.symbol}
                </div>
                <div className={`tx-col tx-status ${tx.status.toLowerCase()}`}>
                  {tx.status}
                </div>
              </div>
            ))}
          </div>
          
          <div className="pagination">
            <button 
              onClick={handlePrevPage} 
              disabled={page === 1}
              className="pagination-button"
            >
              Previous
            </button>
            <span className="page-number">Page {page}</span>
            <button 
              onClick={handleNextPage}
              disabled={transactions.length < pageSize}
              className="pagination-button"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionHistory; 