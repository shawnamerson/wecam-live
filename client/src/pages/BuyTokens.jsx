import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { useTokens } from '../contexts/TokenContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { Link } from 'react-router-dom';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

function CheckoutForm({ onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message);
      setProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message);
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form className="stripe-form" onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <div className="auth-error">{error}</div>}
      <button className="btn btn-start" type="submit" disabled={!stripe || processing}>
        {processing ? 'Processing...' : 'Pay'}
      </button>
    </form>
  );
}

export default function BuyTokens() {
  usePageMeta({ title: 'Buy Tokens - WeCam', description: 'Purchase tokens for gender-filtered matching on WeCam.', path: '/buy-tokens' });

  const { session, user } = useAuth();
  const { balance, refreshBalance } = useTokens();
  const [packages, setPackages] = useState([]);
  const [clientSecret, setClientSecret] = useState(null);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/token-packages`)
      .then(r => r.json())
      .then(setPackages)
      .catch(console.error);
  }, []);

  const selectPackage = async (pkg) => {
    if (!session?.access_token) return;
    setSelectedPkg(pkg);
    setClientSecret(null);
    try {
      const res = await fetch(`${SERVER_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ packageId: pkg.id }),
      });
      const data = await res.json();
      if (data.clientSecret) setClientSecret(data.clientSecret);
    } catch (err) {
      console.error('Payment intent error:', err);
    }
  };

  const handleSuccess = () => {
    setSuccess(true);
    setClientSecret(null);
    setSelectedPkg(null);
    refreshBalance();
  };

  if (!user) {
    return (
      <div className="content-page">
        <div className="content-container" style={{ textAlign: 'center' }}>
          <h1>Buy Tokens</h1>
          <p>Please <Link to="/login">log in</Link> or <Link to="/signup">sign up</Link> to purchase tokens.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-page">
      <div className="content-container">
        <h1>Buy Tokens</h1>
        <p>Your balance: <strong>{balance} tokens</strong></p>
        <p>Tokens are used for gender-filtered matching (1 token per match).</p>

        {success && (
          <div className="token-success">
            Payment successful! Your tokens have been added.
            <button className="btn btn-next" onClick={() => setSuccess(false)} style={{ marginTop: '1rem' }}>
              Buy More
            </button>
          </div>
        )}

        {!success && !clientSecret && (
          <div className="token-packages">
            {packages.map(pkg => (
              <button key={pkg.id} className="token-package-card" onClick={() => selectPackage(pkg)}>
                <div className="token-package-tokens">{pkg.tokens} Tokens</div>
                <div className="token-package-price">${(pkg.price / 100).toFixed(2)}</div>
                <div className="token-package-desc">{pkg.description}</div>
              </button>
            ))}
          </div>
        )}

        {!success && clientSecret && stripePromise && (
          <div>
            <button className="btn btn-stop" onClick={() => { setClientSecret(null); setSelectedPkg(null); }} style={{ marginBottom: '1rem' }}>
              Back
            </button>
            <p style={{ marginBottom: '1rem' }}>
              {selectedPkg.tokens} Tokens &mdash; ${(selectedPkg.price / 100).toFixed(2)}
            </p>
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
              <CheckoutForm onSuccess={handleSuccess} />
            </Elements>
          </div>
        )}
      </div>
    </div>
  );
}
