import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { BusinessBrand, BusinessProduct, ProductQualityTier } from '../types';
import {
  BUSINESS_CATEGORIES,
  calculateEstimatedDemand,
} from '../utils/businessSimulation';
import XIcon from './icons/XIcon';
import PlusIcon from './icons/PlusIcon';
import BanknotesIcon from './icons/BanknotesIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';
import StarIcon from './icons/StarIcon';
import FireIcon from './icons/FireIcon';
import ShoppingBagIcon from './icons/ShoppingBagIcon';
import TicketIcon from './icons/TicketIcon';
import ShieldCheckIcon from './icons/CheckCircleIcon';
import ProductLaunchPartyModal from './ProductLaunchPartyModal';

interface BusinessDetailModalProps {
  business: BusinessBrand;
  onClose: () => void;
}

export const BusinessDetailModal: React.FC<BusinessDetailModalProps> = ({
  business: initialBusiness,
  onClose,
}) => {
  const { gameState, dispatch } = useGame();
  const activeArtistId = gameState.activeArtistId;
  const artistData = activeArtistId ? gameState.artistsData[activeArtistId] : null;

  // Always bind to live business from artistData so reducer updates (funds, hype, campaigns) reflect instantly!
  const business =
    artistData?.businesses?.find((b) => b.id === initialBusiness.id) || initialBusiness;

  const [activeTab, setActiveTab] = useState<'products' | 'marketing' | 'treasury'>('products');
  const [marketingSuccessNotice, setMarketingSuccessNotice] = useState<{
    title: string;
    hype: string;
    cost: number;
  } | null>(null);
  const [isLaunchPartyOpen, setIsLaunchPartyOpen] = useState(false);

  // Restock modal state
  const [restockProduct, setRestockProduct] = useState<BusinessProduct | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10000);

  // New product launch state
  const [isAddingProduct, setIsAddingProduct] = useState<boolean>(false);
  const [newProdName, setNewProdName] = useState<string>('');
  const [newProdCategory, setNewProdCategory] = useState<string>('');
  const [newProdTier, setNewProdTier] = useState<ProductQualityTier>('premium');
  const [newProdPrice, setNewProdPrice] = useState<number>(65);
  const [newProdStock, setNewProdStock] = useState<number>(15000);

  const treasuryFunds = business.treasuryFunds || 0;
  const personalFunds = artistData?.money || 0;
  const totalAvailableFunds = treasuryFunds + personalFunds;

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState<number>(
    Math.min(treasuryFunds, 1000000)
  );

  const categoryConfig = business.category ? BUSINESS_CATEGORIES[business.category] : null;

  // Restock calculation
  const restockCost = restockProduct ? restockProduct.unitCost * restockQty : 0;
  const canAffordRestock = totalAvailableFunds >= restockCost;

  const handleRestock = () => {
    if (!restockProduct) return;
    dispatch({
      type: 'RESTOCK_BUSINESS_PRODUCT',
      payload: {
        businessId: business.id,
        productId: restockProduct.id,
        additionalStock: restockQty,
      },
    });
    setRestockProduct(null);
  };

  // Launch new product
  const newProdCost = categoryConfig
    ? categoryConfig.defaultUnitCosts[newProdTier] * newProdStock
    : 10 * newProdStock;
  const canAffordNewProd = totalAvailableFunds >= newProdCost;

  const handleLaunchNewProduct = () => {
    if (!newProdName.trim()) return;
    const unitCost = categoryConfig ? categoryConfig.defaultUnitCosts[newProdTier] : 10;
    const demand = calculateEstimatedDemand({
      price: newProdPrice,
      qualityTier: newProdTier,
      category: business.category || 'perfume',
      popularity: artistData?.popularity || 50,
      publicImage: artistData?.publicImage || 50,
      hype: (artistData?.hype || 50) + (business.brandHype || 0),
    });

    dispatch({
      type: 'LAUNCH_BUSINESS_PRODUCT',
      payload: {
        businessId: business.id,
        product: {
          name: newProdName.trim(),
          category: newProdCategory.trim() || 'Product',
          qualityTier: newProdTier,
          unitCost,
          price: newProdPrice,
          initialStock: newProdStock,
          estimatedDemandScore: demand.demandScore,
        },
      },
    });
    setIsAddingProduct(false);
    setNewProdName('');
    setNewProdCategory('');
  };

  // Withdraw funds
  const handleWithdraw = () => {
    if (withdrawAmount <= 0 || withdrawAmount > treasuryFunds) return;
    dispatch({
      type: 'WITHDRAW_BUSINESS_FUNDS',
      payload: {
        businessId: business.id,
        amount: withdrawAmount,
      },
    });
  };

  // 6 Fully Implemented Marketing & PR Campaigns
  const marketingCampaigns = [
    {
      id: 'social_blitz',
      title: 'Social Media Viral Blitz',
      cost: 50000,
      hype: '+15 Brand Hype',
      desc: 'Sponsored TikTok creator reviews, trending sound integration, and X takeover pushes.',
    },
    {
      id: 'influencer_gift',
      title: 'A-List Influencer PR Gifting',
      cost: 120000,
      hype: '+20 Brand Hype',
      desc: 'Send custom engraved PR luxury unboxing vaults to top beauty and lifestyle creators.',
    },
    {
      id: 'vogue_ad',
      title: 'Exclusive Vogue & Editorial Spread',
      cost: 200000,
      hype: '+22 Brand Hype',
      desc: 'High-fashion double-page editorial photoshoot and founder interview in Vogue & GQ.',
    },
    {
      id: 'popup_store',
      title: 'Flagship Pop-Up Experience',
      cost: 350000,
      hype: '+25 Brand Hype',
      desc: 'Immersive pop-up retail installation in SoHo New York & West Hollywood with fan meet-and-greets.',
    },
    {
      id: 'times_square',
      title: 'Times Square & Global Digital Billboards',
      cost: 600000,
      hype: '+30 Brand Hype',
      desc: 'Towering digital billboards across Times Square, London Piccadilly Lights, and Tokyo Shibuya.',
    },
    {
      id: 'brand_ambassador',
      title: 'Celebrity Brand Ambassador Signing',
      cost: 1000000,
      hype: '+35 Brand Hype',
      desc: 'Contract a top supermodel or international celebrity to co-star in global billboard and TV ad campaigns.',
    },
  ];

  const handleRunMarketing = (camp: typeof marketingCampaigns[0]) => {
    if (totalAvailableFunds < camp.cost) return;
    dispatch({
      type: 'MARKET_BUSINESS',
      payload: {
        businessId: business.id,
        campaignType: camp.id,
        cost: camp.cost,
      },
    });
    setMarketingSuccessNotice({
      title: camp.title,
      hype: camp.hype,
      cost: camp.cost,
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative max-w-3xl w-full max-h-[92vh] overflow-y-auto bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-5 sm:p-7 text-white space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-amber-400/60 overflow-hidden shrink-0 shadow-lg flex items-center justify-center">
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-black text-amber-400">
                  {business.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white">{business.name}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  {business.legalName}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                <span>{business.categoryDisplayName || 'Consumer Brand'}</span>
                <span>&bull;</span>
                <span className="flex items-center gap-1 text-amber-400">
                  <FireIcon className="w-3.5 h-3.5" />
                  {business.brandHype || 35} Brand Hype
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Financial KPI Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-500 uppercase block tracking-wider">
              Total Revenue
            </span>
            <span className="text-lg font-black text-emerald-400">
              ${business.totalRevenue.toLocaleString()}
            </span>
          </div>

          <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-500 uppercase block tracking-wider">
              Total Net Profit
            </span>
            <span className="text-lg font-black text-emerald-300">
              ${business.totalNetProfit.toLocaleString()}
            </span>
          </div>

          <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-500 uppercase block tracking-wider">
              Brand Treasury
            </span>
            <span className="text-lg font-black text-amber-400">
              ${business.treasuryFunds.toLocaleString()}
            </span>
          </div>

          <div className="bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-500 uppercase block tracking-wider">
              Total Units Sold
            </span>
            <span className="text-lg font-black text-white">
              {business.products
                .reduce((acc, p) => acc + p.totalUnitsSold, 0)
                .toLocaleString()}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-2.5 px-4 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'products'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <span>Products & Inventory ({business.products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('marketing')}
            className={`pb-2.5 px-4 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'marketing'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <MegaphoneIcon className="w-3.5 h-3.5" />
            <span>PR & Marketing</span>
          </button>
          <button
            onClick={() => setActiveTab('treasury')}
            className={`pb-2.5 px-4 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'treasury'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <BanknotesIcon className="w-3.5 h-3.5" />
            <span>Treasury & Dividends</span>
          </button>
        </div>

        {/* TAB 1: PRODUCTS */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                Product Lineup
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingProduct(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Launch New Product</span>
              </button>
            </div>

            {/* Product Cards */}
            <div className="space-y-3">
              {business.products.map((product) => {
                const isSoldOut = product.currentStock === 0;
                const stockPercent = Math.round(
                  (product.currentStock / product.initialStock) * 100
                );

                return (
                  <div
                    key={product.id}
                    className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{product.name}</h4>
                        {isSoldOut ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40">
                            Sold Out
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            In Stock
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-800 text-zinc-400 capitalize">
                          {product.qualityTier}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-zinc-400">
                        <span>Price: <strong className="text-amber-400">${product.price}</strong></span>
                        <span>Sold: <strong className="text-white">{product.totalUnitsSold.toLocaleString()}</strong></span>
                        <span>Rev: <strong className="text-emerald-400">${product.totalRevenue.toLocaleString()}</strong></span>
                        <span className="flex items-center gap-1 text-amber-400">
                          <StarIcon className="w-3.5 h-3.5 fill-amber-400" />
                          {product.customerRating.toFixed(1)} ({product.reviewsCount})
                        </span>
                      </div>

                      {/* Stock Progress Bar */}
                      <div className="space-y-1 pt-1 max-w-sm">
                        <div className="flex justify-between text-[10px] text-zinc-500">
                          <span>Inventory Remaining</span>
                          <span className="font-bold text-zinc-400">
                            {product.currentStock.toLocaleString()} / {product.initialStock.toLocaleString()} ({stockPercent}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isSoldOut
                                ? 'bg-rose-500'
                                : stockPercent < 20
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, stockPercent))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          setRestockProduct(product);
                          setRestockQty(15000);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-zinc-200 transition-colors"
                      >
                        Restock Inventory
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RESTOCK MODAL */}
            {restockProduct && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400">
                    Restock: {restockProduct.name}
                  </h4>
                  <button
                    onClick={() => setRestockProduct(null)}
                    className="text-zinc-500 hover:text-white text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">
                      Additional Stock Units
                    </label>
                    <input
                      type="number"
                      step={1000}
                      min={1000}
                      value={restockQty}
                      onChange={(e) => setRestockQty(Math.max(500, Number(e.target.value)))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                      Restock Cost
                    </span>
                    <span className="text-sm font-black text-amber-400">
                      ${restockCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleRestock}
                    disabled={!canAffordRestock}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      canAffordRestock
                        ? 'bg-amber-500 hover:bg-amber-400 text-black cursor-pointer'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    Confirm Restock (${restockCost.toLocaleString()})
                  </button>
                </div>
              </div>
            )}

            {/* ADD PRODUCT MODAL */}
            {isAddingProduct && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400">
                    Launch Additional Product
                  </h4>
                  <button
                    onClick={() => setIsAddingProduct(false)}
                    className="text-zinc-500 hover:text-white text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      placeholder="e.g. Silk Hydration Mist"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">
                      Sub-Category
                    </label>
                    <input
                      type="text"
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value)}
                      placeholder="e.g. Body Care, Sneaker"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">
                      Quality Tier
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['standard', 'premium', 'luxury'] as ProductQualityTier[]).map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setNewProdTier(tier)}
                          className={`py-1 text-[11px] font-bold rounded capitalize border ${
                            newProdTier === tier
                              ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">
                      Retail Price ($)
                    </label>
                    <input
                      type="number"
                      min={5}
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">
                      Initial Production Stock
                    </label>
                    <input
                      type="number"
                      step={1000}
                      min={1000}
                      value={newProdStock}
                      onChange={(e) => setNewProdStock(Math.max(500, Number(e.target.value)))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <span className="text-xs text-zinc-400">
                    Production Cost:{' '}
                    <strong className="text-amber-400">${newProdCost.toLocaleString()}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleLaunchNewProduct}
                    disabled={!canAffordNewProd}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold ${
                      canAffordNewProd
                        ? 'bg-amber-500 hover:bg-amber-400 text-black cursor-pointer'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    Launch Product
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MARKETING & PR */}
        {activeTab === 'marketing' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                Marketing & Brand Campaigns
              </h3>
              <p className="text-xs text-zinc-400">
                Drive hype, viral social media buzz, and boost weekly sales sell-through rates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {marketingCampaigns.map((camp) => {
                const canAffordCamp = business.treasuryFunds >= camp.cost;
                return (
                  <div
                    key={camp.id}
                    className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-sm text-white">{camp.title}</h4>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                          {camp.hype}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{camp.desc}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                      <span className="text-xs font-black text-amber-400">
                        ${camp.cost.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRunMarketing(camp.id, camp.cost)}
                        disabled={!canAffordCamp}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          canAffordCamp
                            ? 'bg-amber-500 hover:bg-amber-400 text-black cursor-pointer'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        Launch Campaign
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: TREASURY & DIVIDENDS */}
        {activeTab === 'treasury' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                Treasury & Founder Dividends
              </h3>
              <p className="text-xs text-zinc-400">
                Withdraw operating profits from your brand treasury directly into your personal bank account.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400 uppercase font-semibold">
                  Available Brand Treasury
                </span>
                <span className="text-lg font-black text-amber-400">
                  ${business.treasuryFunds.toLocaleString()}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Withdrawal Amount
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1000}
                    max={business.treasuryFunds}
                    step={50000}
                    value={withdrawAmount}
                    onChange={(e) =>
                      setWithdrawAmount(
                        Math.min(business.treasuryFunds, Math.max(0, Number(e.target.value)))
                      )
                    }
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(business.treasuryFunds)}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 border border-zinc-700"
                  >
                    Max
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleWithdraw}
                disabled={withdrawAmount <= 0 || withdrawAmount > business.treasuryFunds}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                  withdrawAmount > 0 && withdrawAmount <= business.treasuryFunds
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white cursor-pointer shadow-lg shadow-emerald-600/20'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                }`}
              >
                Transfer ${withdrawAmount.toLocaleString()} to Personal Funds
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessDetailModal;
