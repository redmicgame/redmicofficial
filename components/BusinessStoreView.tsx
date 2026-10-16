import React, { useState, useRef, useMemo } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import { BusinessBrand, BusinessProduct, ProductQualityTier } from '../types';
import { BUSINESS_CATEGORIES, calculateEstimatedDemand } from '../utils/businessSimulation';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ShoppingBagIcon from './icons/ShoppingBagIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import CameraIcon from './icons/CameraIcon';
import TicketIcon from './icons/TicketIcon';
import StarIcon from './icons/StarIcon';
import ProductLaunchPartyModal from './ProductLaunchPartyModal';

interface BusinessStoreViewProps {
  businessId?: string;
  onBack?: () => void;
}

export const BusinessStoreView: React.FC<BusinessStoreViewProps> = ({
  businessId: propBusinessId,
  onBack,
}) => {
  const { gameState, dispatch } = useGame();
  const activeArtistId = gameState.activeArtistId;
  const artistData = activeArtistId ? gameState.artistsData[activeArtistId] : null;

  const businesses: BusinessBrand[] = artistData?.businesses || [];
  const approvedBusinesses = businesses.filter((b) => b.llcStatus === 'approved');

  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(
    propBusinessId || approvedBusinesses[0]?.id || ''
  );

  const business = approvedBusinesses.find((b) => b.id === selectedBusinessId) || approvedBusinesses[0];

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [productImageTargetId, setProductImageTargetId] = useState<string | null>(null);
  const productImageInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [restockProduct, setRestockProduct] = useState<BusinessProduct | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10000);
  const [editingPriceProduct, setEditingPriceProduct] = useState<BusinessProduct | null>(null);
  const [newPriceValue, setNewPriceValue] = useState<number>(50);
  const [launchPartyProductId, setLaunchPartyProductId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Add Product form state
  const [addName, setAddName] = useState('');
  const [addCategory, setAddCategory] = useState('');
  const [addTier, setAddTier] = useState<ProductQualityTier>('premium');
  const [addPrice, setAddPrice] = useState(65);
  const [addStock, setAddStock] = useState(15000);
  const [addImageUrl, setAddImageUrl] = useState('');

  const categoryConfig = business?.category ? BUSINESS_CATEGORIES[business.category] : null;

  // Handle Banner Upload
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && business) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        dispatch({
          type: 'UPDATE_BUSINESS_BANNER',
          payload: {
            businessId: business.id,
            bannerUrl: reader.result as string,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Product Image Upload (tap to upload on any product card)
  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && business && productImageTargetId) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        dispatch({
          type: 'UPDATE_BUSINESS_PRODUCT_IMAGE',
          payload: {
            businessId: business.id,
            productId: productImageTargetId,
            imageUrl: reader.result as string,
          },
        });
        setProductImageTargetId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerProductImageUpload = (productId: string) => {
    setProductImageTargetId(productId);
    productImageInputRef.current?.click();
  };

  // Restock calculation
  const restockCost = restockProduct ? restockProduct.unitCost * restockQty : 0;
  const canAffordRestock = (business?.treasuryFunds || 0) + (artistData?.money || 0) >= restockCost;

  const handleConfirmRestock = () => {
    if (!business || !restockProduct) return;
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

  // Save new price
  const handleSavePrice = () => {
    if (!business || !editingPriceProduct || newPriceValue <= 0) return;
    dispatch({
      type: 'UPDATE_BUSINESS_PRODUCT_PRICE',
      payload: {
        businessId: business.id,
        productId: editingPriceProduct.id,
        price: newPriceValue,
      },
    });
    setEditingPriceProduct(null);
  };

  // Delete product
  const handleDeleteProduct = (productId: string) => {
    if (!business) return;
    if (window.confirm('Are you sure you want to remove this product from your official brand store?')) {
      dispatch({
        type: 'DELETE_BUSINESS_PRODUCT',
        payload: {
          businessId: business.id,
          productId,
        },
      });
    }
  };

  // Add Product Submit
  const handleCreateProduct = () => {
    if (!business || !addName.trim()) return;
    const unitCost = categoryConfig ? categoryConfig.defaultUnitCosts[addTier] : 10;
    const demand = calculateEstimatedDemand({
      price: addPrice,
      qualityTier: addTier,
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
          name: addName.trim(),
          category: addCategory.trim() || 'Flagship Item',
          qualityTier: addTier,
          unitCost,
          price: addPrice,
          initialStock: addStock,
          estimatedDemandScore: demand.demandScore,
          imageUrl: addImageUrl || undefined,
        },
      },
    });

    setShowAddProductModal(false);
    setAddName('');
    setAddCategory('');
    setAddImageUrl('');
  };

  const filteredProducts = useMemo(() => {
    if (!business?.products) return [];
    if (filterCategory === 'in_stock') {
      return business.products.filter((p) => p.currentStock > 0);
    }
    if (filterCategory === 'sold_out') {
      return business.products.filter((p) => p.currentStock === 0);
    }
    return business.products;
  }, [business?.products, filterCategory]);

  if (!business) {
    return (
      <div className="bg-white text-black min-h-screen p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">No Active Store Available</h2>
        <p className="text-sm text-zinc-500">
          You must form an LLC and launch a brand in the Business tab first.
        </p>
        <button
          onClick={() => (onBack ? onBack() : dispatch({ type: 'CHANGE_VIEW', payload: 'game' }))}
          className="px-4 py-2 rounded-lg bg-black text-white text-xs font-bold"
        >
          Return to Business
        </button>
      </div>
    );
  }

  const activeArtistName =
    gameState.soloArtist?.name ||
    gameState.group?.name ||
    (gameState.artists || []).find((a) => a.id === activeArtistId)?.name ||
    'Artist';

  return (
    <div className="bg-white text-black min-h-screen flex flex-col font-sans overflow-y-auto pb-24">
      {/* Hidden inputs for tap-to-upload */}
      <input
        type="file"
        ref={bannerInputRef}
        onChange={handleBannerUpload}
        className="hidden"
        accept="image/*"
      />
      <input
        type="file"
        ref={productImageInputRef}
        onChange={handleProductImageUpload}
        className="hidden"
        accept="image/*"
      />

      {/* Top Navigation Header (styled like the merch store) */}
      <header className="sticky top-0 bg-white z-20 border-b border-zinc-200 shadow-xs">
        <div className="p-4 flex justify-between items-center max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => (onBack ? onBack() : dispatch({ type: 'CHANGE_VIEW', payload: 'game' }))}
              className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-700 transition-colors cursor-pointer"
              title="Return"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-[0.15em] uppercase font-anton">
                  {business.name}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-300 uppercase">
                  {business.categoryDisplayName || 'Official Brand'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-semibold">
                By {activeArtistName} &bull; {business.products?.length || 0} Products in Store
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Multiple brands dropdown if player owns > 1 */}
            {approvedBusinesses.length > 1 && (
              <select
                value={business.id}
                onChange={(e) => setSelectedBusinessId(e.target.value)}
                className="bg-zinc-100 border border-zinc-300 rounded-md px-2.5 py-1.5 text-xs font-bold text-zinc-800"
              >
                {approvedBusinesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setShowAddProductModal(true)}
              className="bg-black hover:bg-zinc-800 text-white font-bold py-1.5 px-3.5 rounded-md inline-flex items-center gap-1.5 text-xs transition-colors cursor-pointer shadow-sm"
            >
              <PlusIcon className="w-4 h-4" /> Add Product
            </button>

            <button
              type="button"
              onClick={() => setLaunchPartyProductId(business.products?.[0]?.id || '')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-3.5 rounded-md inline-flex items-center gap-1.5 text-xs transition-colors cursor-pointer shadow-sm"
            >
              <TicketIcon className="w-4 h-4" /> Launch Party
            </button>

            <div className="p-1.5 text-zinc-600">
              <ShoppingBagIcon className="w-5 h-5" />
            </div>
          </div>
        </div>
      </header>

      {/* STORE HERO BANNER (Tap to upload) */}
      <div className="relative group w-full h-[28vh] md:h-[38vh] bg-zinc-900 overflow-hidden flex items-center justify-center">
        {business.bannerUrl ? (
          <img
            src={business.bannerUrl}
            alt={`${business.name} Store Banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-6 space-y-2">
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-[0.2em] font-anton drop-shadow">
              {business.name}
            </h2>
            <p className="text-zinc-400 text-xs tracking-widest uppercase">
              The Official Consumer Collection &bull; Tap to Upload Custom Store Banner
            </p>
          </div>
        )}

        {/* Hover / Tap to upload banner overlay */}
        <button
          onClick={() => bannerInputRef.current?.click()}
          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-2 text-sm cursor-pointer"
        >
          <CameraIcon className="w-5 h-5 text-amber-400" />
          <span>Tap to Upload / Change Store Banner</span>
        </button>
      </div>

      {/* FILTER TABS & STATS BAR */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                filterCategory === 'all'
                  ? 'bg-black text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              All Products ({business.products?.length || 0})
            </button>
            <button
              onClick={() => setFilterCategory('in_stock')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                filterCategory === 'in_stock'
                  ? 'bg-black text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              In Stock ({business.products?.filter((p) => p.currentStock > 0).length || 0})
            </button>
            <button
              onClick={() => setFilterCategory('sold_out')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                filterCategory === 'sold_out'
                  ? 'bg-black text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Sold Out ({business.products?.filter((p) => p.currentStock === 0).length || 0})
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-zinc-600">
            <span>
              Total Units Sold:{' '}
              <strong className="text-black">
                {business.products?.reduce((acc, p) => acc + p.totalUnitsSold, 0).toLocaleString()}
              </strong>
            </span>
            <span>
              Store Revenue:{' '}
              <strong className="text-emerald-600">${business.totalRevenue.toLocaleString()}</strong>
            </span>
          </div>
        </div>

        {/* PRODUCTS GRID (Aesthetic layout with tap to upload image) */}
        <div className="pt-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <ShoppingBagIcon className="w-12 h-12 text-zinc-300 mx-auto" />
              <h3 className="font-bold text-base text-zinc-700">No products match this filter</h3>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="px-4 py-2 rounded-lg bg-black text-white text-xs font-bold"
              >
                Launch New Product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
              {filteredProducts.map((product) => {
                const isSoldOut = product.currentStock === 0;

                return (
                  <div
                    key={product.id}
                    className="group border border-zinc-200 bg-white rounded-xl overflow-hidden flex flex-col shadow-xs hover:shadow-lg transition-all"
                  >
                    {/* PRODUCT IMAGE CONTAINER with TAP TO UPLOAD */}
                    <div className="relative w-full aspect-square bg-zinc-100 overflow-hidden flex items-center justify-center">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-200 flex flex-col items-center justify-center p-4 text-center">
                          <ShoppingBagIcon className="w-12 h-12 text-zinc-400 mb-2" />
                          <span className="text-xs font-black uppercase tracking-wider text-zinc-600">
                            {product.name}
                          </span>
                        </div>
                      )}

                      {/* Tap to Upload Overlay */}
                      <button
                        type="button"
                        onClick={() => triggerProductImageUpload(product.id)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer p-2 text-center"
                      >
                        <CameraIcon className="w-6 h-6 text-amber-400" />
                        <span>Tap to upload / change photo</span>
                      </button>

                      {/* Quality & Stock Badges */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 pointer-events-none">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-black/80 text-white backdrop-blur-xs">
                          {product.qualityTier === 'luxury'
                            ? '👑 Luxury'
                            : product.qualityTier === 'premium'
                            ? '✨ Premium'
                            : '📦 Standard'}
                        </span>
                        {isSoldOut ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm">
                            Sold Out
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm">
                            {product.currentStock.toLocaleString()} left
                          </span>
                        )}
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/80 hover:bg-rose-600 text-zinc-700 hover:text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Delete product"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* DETAILS */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            {product.category}
                          </span>
                          <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500">
                            <StarIcon className="w-3.5 h-3.5 fill-amber-400" />
                            {product.customerRating?.toFixed(1) || '4.8'}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-zinc-900 leading-snug line-clamp-1">
                          {product.name}
                        </h3>

                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-base font-black text-black">
                            ${product.price}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            Unit Cost: ${product.unitCost}
                          </span>
                        </div>
                      </div>

                      {/* Financial info */}
                      <div className="bg-zinc-50 rounded-lg p-2.5 text-[11px] text-zinc-600 space-y-1 border border-zinc-100">
                        <div className="flex justify-between">
                          <span>Units Sold:</span>
                          <strong className="text-black">{product.totalUnitsSold.toLocaleString()}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Revenue:</span>
                          <strong className="text-emerald-600">${product.totalRevenue.toLocaleString()}</strong>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setRestockProduct(product);
                            setRestockQty(10000);
                          }}
                          className="py-1.5 px-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-colors text-center cursor-pointer"
                        >
                          Restock
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPriceProduct(product);
                            setNewPriceValue(product.price);
                          }}
                          className="py-1.5 px-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-colors text-center cursor-pointer"
                        >
                          Edit Price
                        </button>

                        <button
                          type="button"
                          onClick={() => setLaunchPartyProductId(product.id)}
                          className="col-span-2 py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <TicketIcon className="w-3.5 h-3.5" />
                          <span>Host Launch Party</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RESTOCK MODAL */}
      {restockProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          onClick={() => setRestockProduct(null)}
        >
          <div
            className="bg-white text-black max-w-sm w-full rounded-2xl p-5 shadow-2xl border border-zinc-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base">Restock: {restockProduct.name}</h3>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                Units to Produce
              </label>
              <input
                type="number"
                step={1000}
                min={500}
                value={restockQty}
                onChange={(e) => setRestockQty(Math.max(100, Number(e.target.value)))}
                className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold"
              />
              <span className="text-xs text-zinc-500 block pt-1">
                Total Production Cost: <strong className="text-black">${restockCost.toLocaleString()}</strong>
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestockProduct(null)}
                className="flex-1 py-2 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestock}
                disabled={!canAffordRestock}
                className="flex-1 py-2 rounded-lg bg-black text-white text-xs font-bold disabled:bg-zinc-300"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PRICE MODAL */}
      {editingPriceProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          onClick={() => setEditingPriceProduct(null)}
        >
          <div
            className="bg-white text-black max-w-sm w-full rounded-2xl p-5 shadow-2xl border border-zinc-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base">Edit Price: {editingPriceProduct.name}</h3>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">
                Retail Price ($)
              </label>
              <input
                type="number"
                min={1}
                value={newPriceValue}
                onChange={(e) => setNewPriceValue(Math.max(1, Number(e.target.value)))}
                className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold"
              />
              <span className="text-xs text-zinc-500 block pt-1">
                Manufacturing unit cost: ${editingPriceProduct.unitCost}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPriceProduct(null)}
                className="flex-1 py-2 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePrice}
                className="flex-1 py-2 rounded-lg bg-black text-white text-xs font-bold"
              >
                Save Price
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {showAddProductModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto"
          onClick={() => setShowAddProductModal(false)}
        >
          <div
            className="bg-zinc-900 text-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-zinc-700 space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white">Add Product to Store</h3>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold uppercase text-zinc-400 block mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Signature Eau de Parfum"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-zinc-400 block mb-1">
                  Category / Type
                </label>
                <input
                  type="text"
                  value={addCategory}
                  onChange={(e) => setAddCategory(e.target.value)}
                  placeholder="e.g. Eau de Parfum, Lip Oil"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-zinc-400 block mb-1">
                  Quality Tier
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['standard', 'premium', 'luxury'] as ProductQualityTier[]).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setAddTier(tier)}
                      className={`py-1.5 rounded-lg font-bold capitalize border ${
                        addTier === tier
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold uppercase text-zinc-400 block mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={addPrice}
                    onChange={(e) => setAddPrice(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-zinc-400 block mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    step={1000}
                    min={1000}
                    value={addStock}
                    onChange={(e) => setAddStock(Math.max(100, Number(e.target.value)))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold uppercase text-zinc-400 block mb-1">
                  Product Image URL (or tap card image after adding)
                </label>
                <input
                  type="text"
                  value={addImageUrl}
                  onChange={(e) => setAddImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateProduct}
                disabled={!addName.trim()}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold disabled:bg-zinc-800 disabled:text-zinc-500 cursor-pointer"
              >
                Add Product to Store
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LAUNCH PARTY MODAL */}
      {launchPartyProductId !== null && (
        <ProductLaunchPartyModal
          onClose={() => setLaunchPartyProductId(null)}
          preselectedBusinessId={business.id}
          preselectedProductId={launchPartyProductId}
        />
      )}
    </div>
  );
};

export default BusinessStoreView;
