import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { BusinessBrand, BusinessCategory, ProductQualityTier } from '../types';
import {
  BUSINESS_CATEGORIES,
  calculateEstimatedDemand,
  PRESET_LOGOS,
} from '../utils/businessSimulation';
import XIcon from './icons/XIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import CameraIcon from './icons/CameraIcon';
import SparklesIcon from './icons/FireIcon';

interface SetupBusinessBrandModalProps {
  business: BusinessBrand;
  onClose: () => void;
}

interface ProductDraft {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  qualityTier: ProductQualityTier;
  unitCost: number;
  price: number;
  stock: number;
}

export const SetupBusinessBrandModal: React.FC<SetupBusinessBrandModalProps> = ({
  business,
  onClose,
}) => {
  const { gameState, dispatch } = useGame();
  const activeArtistId = gameState.activeArtistId;
  const artistData = activeArtistId ? gameState.artistsData[activeArtistId] : null;

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Logo
  const [logoUrl, setLogoUrl] = useState<string>(
    business.logoUrl || PRESET_LOGOS[0].url
  );

  // Step 2: Category
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory>(
    business.category || 'perfume'
  );

  // Step 3: Products (1 to 3 products)
  const categoryConfig = BUSINESS_CATEGORIES[selectedCategory];

  const initialDrafts: ProductDraft[] = useMemo(() => {
    const ideas = categoryConfig.defaultProductIdeas;
    return [
      {
        id: 'prod_1',
        name: ideas[0]?.name || `${business.name} Debut Item`,
        category: ideas[0]?.category || 'Flagship Item',
        description: ideas[0]?.description || '',
        imageUrl: ideas[0]?.image || '',
        qualityTier: ideas[0]?.recommendedTier || 'premium',
        unitCost: categoryConfig.defaultUnitCosts[ideas[0]?.recommendedTier || 'premium'],
        price: categoryConfig.recommendedPrices[ideas[0]?.recommendedTier || 'premium'].standard,
        stock: 20000,
      },
    ];
  }, [categoryConfig, business.name]);

  const [products, setProducts] = useState<ProductDraft[]>(initialDrafts);
  const [error, setError] = useState<string | null>(null);

  // Handle changing category: reload product suggestions if on step 2
  const handleSelectCategory = (cat: BusinessCategory) => {
    setSelectedCategory(cat);
    const newConfig = BUSINESS_CATEGORIES[cat];
    const idea = newConfig.defaultProductIdeas[0];
    const recTier = idea?.recommendedTier || 'premium';
    setProducts([
      {
        id: 'prod_1',
        name: idea?.name || `${business.name} Signature`,
        category: idea?.category || 'Flagship Item',
        description: idea?.description || '',
        imageUrl: idea?.image || '',
        qualityTier: recTier,
        unitCost: newConfig.defaultUnitCosts[recTier],
        price: newConfig.recommendedPrices[recTier].standard,
        stock: 20000,
      },
    ]);
  };

  // Add a product (up to 3 products max)
  const handleAddProduct = () => {
    if (products.length >= 3) return;
    const index = products.length;
    const idea = categoryConfig.defaultProductIdeas[index] || categoryConfig.defaultProductIdeas[0];
    const recTier = idea?.recommendedTier || 'standard';
    const newDraft: ProductDraft = {
      id: `prod_${Date.now()}`,
      name: idea ? idea.name : `${business.name} Product ${index + 1}`,
      category: idea ? idea.category : 'Collection Item',
      description: idea ? idea.description : '',
      imageUrl: idea ? idea.image : '',
      qualityTier: recTier,
      unitCost: categoryConfig.defaultUnitCosts[recTier],
      price: categoryConfig.recommendedPrices[recTier].standard,
      stock: 15000,
    };
    setProducts([...products, newDraft]);
  };

  const handleRemoveProduct = (index: number) => {
    if (products.length <= 1) return;
    const updated = [...products];
    updated.splice(index, 1);
    setProducts(updated);
  };

  const handleUpdateProduct = (index: number, updates: Partial<ProductDraft>) => {
    const updated = [...products];
    const current = updated[index];
    const merged = { ...current, ...updates };

    // If qualityTier changed, update default unitCost and suggested price
    if (updates.qualityTier && updates.qualityTier !== current.qualityTier) {
      merged.unitCost = categoryConfig.defaultUnitCosts[updates.qualityTier];
      merged.price = categoryConfig.recommendedPrices[updates.qualityTier].standard;
    }

    updated[index] = merged;
    setProducts(updated);
  };

  // Handle Logo file upload
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Total production cost
  const totalProductionCost = products.reduce(
    (acc, p) => acc + p.unitCost * p.stock,
    0
  );

  const availableTreasury = business.treasuryFunds;
  const artistMoney = artistData?.money || 0;
  const totalAvailable = availableTreasury + artistMoney;
  const canAfford = totalAvailable >= totalProductionCost;

  // Final Launch
  const handleLaunchBrand = () => {
    // Validate products
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p.name.trim()) {
        setError(`Please enter a name for Product #${i + 1}`);
        return;
      }
      if (p.price <= 0) {
        setError(`Please set a valid price for ${p.name}`);
        return;
      }
      if (p.stock <= 0) {
        setError(`Please set a valid stock amount for ${p.name}`);
        return;
      }
    }

    if (!canAfford) {
      setError(
        `Insufficient funds. Total production cost is $${totalProductionCost.toLocaleString()} but total available is $${totalAvailable.toLocaleString()}.`
      );
      return;
    }

    const preparedProducts = products.map((p) => {
      const demand = calculateEstimatedDemand({
        price: p.price,
        qualityTier: p.qualityTier,
        category: selectedCategory,
        popularity: artistData?.popularity || 50,
        publicImage: artistData?.publicImage || 50,
        hype: (artistData?.hype || 50) + (business.brandHype || 0),
      });

      return {
        name: p.name.trim(),
        category: p.category.trim(),
        description: p.description.trim(),
        imageUrl: p.imageUrl,
        qualityTier: p.qualityTier,
        unitCost: p.unitCost,
        price: p.price,
        initialStock: p.stock,
        estimatedDemandScore: demand.demandScore,
      };
    });

    dispatch({
      type: 'SETUP_BUSINESS_BRAND',
      payload: {
        businessId: business.id,
        logoUrl,
        category: selectedCategory,
        products: preparedProducts,
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative max-w-2xl w-full max-h-[92vh] overflow-y-auto bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-5 sm:p-7 text-white space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                LLC Approved
              </span>
              <h2 className="text-xl font-black text-white">
                Launch Brand: {business.name}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Configure your brand logo, industry, and flagship product line
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Tabs */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
              step === 1
                ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
            }`}
          >
            1. Brand Logo
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
              step === 2
                ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
            }`}
          >
            2. Pick Business Type
          </button>
          <button
            type="button"
            onClick={() => setStep(3)}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
              step === 3
                ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
            }`}
          >
            3. Launch 1-3 Products
          </button>
        </div>

        {/* STEP 1: LOGO */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                Step 1: Upload or Choose Brand Logo
              </h3>
              <p className="text-xs text-zinc-400">
                Upload your custom insignia or choose from curated luxury emblems.
              </p>
            </div>

            {/* Current Selected Logo Preview */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800">
              <div className="w-24 h-24 rounded-2xl bg-zinc-800 border-2 border-amber-400/60 overflow-hidden shrink-0 shadow-lg relative group flex items-center justify-center">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={business.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-black text-zinc-600">
                    {business.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="space-y-2 text-center sm:text-left flex-1">
                <h4 className="text-base font-black text-white">{business.name}</h4>
                <p className="text-xs text-zinc-400">
                  This logo will appear on all product packaging, billboards, and your official brand store.
                </p>

                {/* Upload Button */}
                <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-xs font-bold cursor-pointer transition-colors">
                  <CameraIcon className="w-4 h-4 text-amber-400" />
                  <span>Upload Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Preset Logo Gallery */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Or Select a Designer Preset Logo
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {PRESET_LOGOS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setLogoUrl(preset.url)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      logoUrl === preset.url
                        ? 'border-amber-400 bg-amber-400/15 shadow-sm'
                        : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-16 h-16 rounded-lg object-cover mx-auto mb-1.5 border border-zinc-700"
                    />
                    <span className="text-[10px] font-bold text-zinc-300 block truncate">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Logo URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400">
                Or paste image URL:
              </label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Next: Select Business Type &rarr;
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CATEGORY */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                Step 2: Choose Business Category
              </h3>
              <p className="text-xs text-zinc-400">
                Select your brand&apos;s primary industry (Perfume, Beauty, Hair Care, Shoes, etc.)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {(Object.keys(BUSINESS_CATEGORIES) as BusinessCategory[]).map((catKey) => {
                const cat = BUSINESS_CATEGORIES[catKey];
                const isSelected = selectedCategory === catKey;

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => handleSelectCategory(catKey)}
                    className={`p-4 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400'
                        : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-2xl">{cat.emoji}</span>
                      <h4 className="font-bold text-sm text-white">{cat.label}</h4>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                    {isSelected && (
                      <span className="absolute top-3 right-3 text-amber-400 font-bold text-xs">
                        ✓ Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 transition-colors"
              >
                &larr; Back to Logo
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Next: Launch Products &rarr;
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PRODUCTS & DEMAND */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                  Step 3: Launch First 1-3 Products
                </h3>
                <p className="text-xs text-zinc-400">
                  Configure detailed unit price, stock, and quality for your debut release.
                </p>
              </div>

              {products.length < 3 && (
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="px-3 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Add Product ({products.length}/3)</span>
                </button>
              )}
            </div>

            {/* Treasury & Capital Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 text-xs">
              <div>
                <span className="text-zinc-500 block uppercase font-bold text-[10px]">
                  Brand Treasury Available
                </span>
                <span className="text-amber-400 font-black text-sm">
                  ${availableTreasury.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block uppercase font-bold text-[10px]">
                  Total Production Cost
                </span>
                <span className="text-white font-black text-sm">
                  ${totalProductionCost.toLocaleString()}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-zinc-500 block uppercase font-bold text-[10px]">
                  Remaining Funds
                </span>
                <span
                  className={`font-black text-sm ${
                    availableTreasury >= totalProductionCost
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  ${(availableTreasury - totalProductionCost).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Product Cards */}
            <div className="space-y-5">
              {products.map((product, idx) => {
                const demand = calculateEstimatedDemand({
                  price: product.price,
                  qualityTier: product.qualityTier,
                  category: selectedCategory,
                  popularity: artistData?.popularity || 50,
                  publicImage: artistData?.publicImage || 50,
                  hype: (artistData?.hype || 50) + (business.brandHype || 0),
                });

                const unitProfit = product.price - product.unitCost;
                const profitMargin = Math.round((unitProfit / product.price) * 100);
                const totalItemCost = product.unitCost * product.stock;
                const projectedLaunchRevenue =
                  Math.round(product.stock * demand.estimatedSellThrough) * product.price;

                return (
                  <div
                    key={product.id}
                    className="p-4 sm:p-5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-4 relative"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h4 className="font-black text-sm text-white">
                          Product #{idx + 1}: {product.name || 'Untitled Product'}
                        </h4>
                      </div>

                      {products.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(idx)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 transition-colors"
                          title="Remove product"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Inputs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                          Product Name
                        </label>
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) =>
                            handleUpdateProduct(idx, { name: e.target.value })
                          }
                          placeholder="e.g. Signature Eau de Parfum"
                          className="w-full bg-zinc-800/90 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
                        />
                      </div>

                      {/* Sub-Category */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                          Sub-Category / Type
                        </label>
                        <input
                          type="text"
                          value={product.category}
                          onChange={(e) =>
                            handleUpdateProduct(idx, { category: e.target.value })
                          }
                          placeholder="e.g. Eau de Parfum, Lip Oil, Runner"
                          className="w-full bg-zinc-800/90 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      {/* Quality Tier */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                          Formulation Quality Tier
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['standard', 'premium', 'luxury'] as ProductQualityTier[]).map(
                            (tier) => (
                              <button
                                key={tier}
                                type="button"
                                onClick={() =>
                                  handleUpdateProduct(idx, { qualityTier: tier })
                                }
                                className={`py-1.5 px-2 rounded-lg text-xs font-bold border capitalize transition-all ${
                                  product.qualityTier === tier
                                    ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {tier === 'luxury' ? '👑 Luxury' : tier === 'premium' ? '✨ Premium' : '📦 Standard'}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {/* Price Point */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                            Retail Price
                          </label>
                          <span className="text-xs font-black text-amber-400">
                            ${product.price}
                          </span>
                        </div>
                        <input
                          type="number"
                          min={5}
                          max={1000}
                          value={product.price}
                          onChange={(e) =>
                            handleUpdateProduct(idx, {
                              price: Math.max(1, Number(e.target.value)),
                            })
                          }
                          className="w-full bg-zinc-800/90 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                        />
                        <span className="text-[10px] text-zinc-500">
                          Unit Cost: ${product.unitCost} &bull; Margin: {profitMargin}% (${unitProfit}/unit)
                        </span>
                      </div>

                      {/* Stock Quantity */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                            Production Stock
                          </label>
                          <span className="text-xs font-black text-white">
                            {product.stock.toLocaleString()} units
                          </span>
                        </div>
                        <input
                          type="number"
                          step={1000}
                          min={1000}
                          max={500000}
                          value={product.stock}
                          onChange={(e) =>
                            handleUpdateProduct(idx, {
                              stock: Math.max(100, Number(e.target.value)),
                            })
                          }
                          className="w-full bg-zinc-800/90 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                        />
                        <span className="text-[10px] text-zinc-500">
                          Mfg Total: ${totalItemCost.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* LIVE ESTIMATED DEMAND METER */}
                    <div className="bg-zinc-900/90 border border-amber-500/20 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <SparklesIcon className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-black uppercase tracking-wider text-white">
                            Estimated Market Demand
                          </span>
                        </div>
                        <span className={`text-xs font-black ${demand.demandColor}`}>
                          {demand.demandRating} ({demand.demandScore}%)
                        </span>
                      </div>

                      {/* Demand Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            demand.demandScore >= 80
                              ? 'bg-gradient-to-r from-amber-400 to-emerald-400'
                              : demand.demandScore >= 60
                              ? 'bg-gradient-to-r from-blue-400 to-amber-400'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${demand.demandScore}%` }}
                        />
                      </div>

                      {/* Breakdown Factors */}
                      <div className="grid grid-cols-4 gap-1 text-[10px] text-center text-zinc-400 border-t border-zinc-800/80 pt-2">
                        <div>
                          <span className="block font-bold text-white">
                            {demand.priceScore}%
                          </span>
                          <span>Price</span>
                        </div>
                        <div>
                          <span className="block font-bold text-white">
                            {demand.qualityScore}%
                          </span>
                          <span>Quality</span>
                        </div>
                        <div>
                          <span className="block font-bold text-white">
                            {demand.popularityScore}%
                          </span>
                          <span>Star Power</span>
                        </div>
                        <div>
                          <span className="block font-bold text-white">
                            {demand.hypeScore}%
                          </span>
                          <span>Hype</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-300 italic bg-black/30 p-2 rounded-lg border border-zinc-800">
                        &ldquo;{demand.feedbackTip}&rdquo;
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                        <span>Est. Launch Week Sell-Through:</span>
                        <strong className="text-white">
                          {Math.round(demand.estimatedSellThrough * 100)}% (~
                          {Math.round(product.stock * demand.estimatedSellThrough).toLocaleString()} units / ${projectedLaunchRevenue.toLocaleString()})
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 transition-colors"
              >
                &larr; Back to Category
              </button>
              <button
                type="button"
                onClick={handleLaunchBrand}
                disabled={!canAfford}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl transition-all ${
                  canAfford
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black shadow-amber-500/20 cursor-pointer'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                }`}
              >
                Launch Brand & Flagship Line (${totalProductionCost.toLocaleString()})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupBusinessBrandModal;
