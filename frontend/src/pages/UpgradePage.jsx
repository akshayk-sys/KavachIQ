import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Check, X, ArrowRight, Loader } from 'lucide-react';

export default function UpgradePage() {
  const { user } = useAuthStore();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, subRes, historyRes] = await Promise.all([
        api.get('/upgrade/plans'),
        api.get('/upgrade/subscription'),
        api.get('/upgrade/history')
      ]);

      setPlans(plansRes.data.plans || []);
      setCurrentSubscription(subRes.data.subscription);
      setHistory(historyRes.data.history || []);
    } catch (error) {
      console.error('Error fetching upgrade data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    if (currentSubscription?.plan_id === planId) {
      alert('You are already on this plan');
      return;
    }

    try {
      setUpgrading(planId);
      const response = await api.post('/upgrade/subscribe', {
        planId,
        paymentMethod: 'stripe' // In production, integrate with Stripe
      });

      alert('Upgrade successful!');
      await fetchData();
    } catch (error) {
      alert('Error upgrading: ' + error.message);
    } finally {
      setUpgrading(null);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      setUpgrading('cancel');
      await api.post('/upgrade/cancel');
      alert('Subscription cancelled');
      await fetchData();
    } catch (error) {
      alert('Error cancelling: ' + error.message);
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader className="animate-spin w-8 h-8 text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Upgrade Your Security
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Choose the perfect plan to protect your digital assets
          </p>
          {currentSubscription && (
            <div className="mt-4 text-blue-400">
              Current Plan: <span className="font-bold">{currentSubscription.name}</span>
            </div>
          )}
        </div>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.plan_id === plan.id;
            const isFree = plan.id === 'free';

            return (
              <div
                key={plan.id}
                className={`rounded-lg overflow-hidden transition-all duration-300 ${
                  isCurrentPlan
                    ? 'ring-2 ring-blue-500 scale-105'
                    : 'hover:shadow-xl'
                } ${
                  isFree
                    ? 'bg-slate-700'
                    : 'bg-gradient-to-br from-slate-700 to-slate-600'
                }`}
              >
                {/* Plan Header */}
                <div className="p-8 border-b border-slate-600">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                      <p className="text-sm text-slate-400 mt-1">{plan.description}</p>
                    </div>
                    {isCurrentPlan && (
                      <div className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold">
                        Current
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">
                      ${plan.price}
                    </span>
                    {plan.billing_cycle && (
                      <span className="text-slate-400 ml-2">/{plan.billing_cycle}</span>
                    )}
                  </div>

                  {/* CTA Button */}
                  {!isCurrentPlan && (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={upgrading === plan.id}
                      className={`w-full py-2 px-4 rounded font-semibold flex items-center justify-center gap-2 transition-all ${
                        isFree
                          ? 'bg-slate-600 text-white hover:bg-slate-500'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {upgrading === plan.id ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Upgrading...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4" />
                          {isFree ? 'Get Started' : 'Upgrade'}
                        </>
                      )}
                    </button>
                  )}
                  {isCurrentPlan && !isFree && (
                    <button
                      onClick={handleCancel}
                      disabled={upgrading === 'cancel'}
                      className="w-full py-2 px-4 rounded font-semibold text-red-400 border border-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {upgrading === 'cancel' ? 'Cancelling...' : 'Cancel Plan'}
                    </button>
                  )}
                </div>

                {/* Features List */}
                <div className="p-8">
                  <h4 className="font-bold text-white mb-4">Features:</h4>
                  <ul className="space-y-3">
                    {plan.features && plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-slate-300">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="bg-slate-700 rounded-lg overflow-hidden mb-12">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-white font-semibold">Feature</th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      className="px-6 py-3 text-center text-white font-semibold"
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600">
                <tr>
                  <td className="px-6 py-3 text-slate-300">Price</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="px-6 py-3 text-center text-white">
                      ${plan.price}{plan.billing_cycle ? '/mo' : ''}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-3 text-slate-300">Scans Per Month</td>
                  <td className="px-6 py-3 text-center text-white">5</td>
                  <td className="px-6 py-3 text-center text-white">Unlimited</td>
                  <td className="px-6 py-3 text-center text-white">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-slate-300">CVE Database</td>
                  <td className="px-6 py-3 text-center">
                    <Check className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <Check className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <Check className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-slate-300">Real-time Threats</td>
                  <td className="px-6 py-3 text-center">
                    <X className="w-5 h-5 text-red-400 mx-auto" />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <Check className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <Check className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-slate-300">API Access</td>
                  <td className="px-6 py-3 text-center">
                    <X className="w-5 h-5 text-red-400 mx-auto" />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <Check className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <Check className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-slate-300">24/7 Support</td>
                  <td className="px-6 py-3 text-center">
                    <X className="w-5 h-5 text-red-400 mx-auto" />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <X className="w-5 h-5 text-red-400 mx-auto" />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <Check className="w-5 h-5 text-green-400 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Upgrade History */}
        <div className="bg-slate-700 rounded-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Upgrade History</h2>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
            >
              {showHistory ? 'Hide' : 'Show'}
            </button>
          </div>

          {showHistory && (
            <div className="space-y-3">
              {history.length === 0 ? (
                <p className="text-slate-400">No upgrade history</p>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-600 p-4 rounded flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-semibold capitalize">
                        {item.action}: {item.from_plan || 'Free'} → {item.to_plan}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {item.amount && (
                      <div className="text-right">
                        <p className="text-white font-semibold">${item.amount}</p>
                        <p className="text-green-400 text-sm capitalize">{item.status}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-700 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-2">Can I change plans later?</h3>
              <p className="text-slate-400">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="bg-slate-700 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-2">What payment methods do you accept?</h3>
              <p className="text-slate-400">
                We accept all major credit cards, PayPal, and bank transfers for enterprise customers.
              </p>
            </div>
            <div className="bg-slate-700 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-2">Is there a free trial?</h3>
              <p className="text-slate-400">
                Yes! Start with our Free plan and upgrade whenever you're ready. No credit card required.
              </p>
            </div>
            <div className="bg-slate-700 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-2">What if I cancel?</h3>
              <p className="text-slate-400">
                You can cancel anytime. Your account will revert to the Free plan. No questions asked.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
