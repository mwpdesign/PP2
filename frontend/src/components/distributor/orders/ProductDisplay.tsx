import React from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  quantity: number;
  image?: string;
  specialHandling?: string;
}

interface ProductDisplayProps {
  products: Product[];
}

const ProductDisplay: React.FC<ProductDisplayProps> = ({ products }) => {
  return (
    <div className="space-y-4">
      {products.map((product) => (
        <div key={product.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-4">
            {/* Product Image */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to placeholder on error
                      const target = e.target as HTMLImageElement;
                      target.src = '/api/placeholder/80/80';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Product Information */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">{product.name}</h4>
                  <p className="text-sm text-slate-600 mt-1">{product.description}</p>
                  
                  {/* Quantity */}
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Qty: {product.quantity}
                    </span>
                  </div>

                  {/* Special Handling */}
                  {product.specialHandling && (
                    <div className="mt-2">
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                          <p className="text-xs font-medium text-amber-800">Special Handling Required</p>
                          <p className="text-xs text-amber-700">{product.specialHandling}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product ID */}
                <div className="ml-4">
                  <span className="text-xs text-slate-500 font-mono">{product.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Total Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-slate-700">Total Items:</span>
          <span className="text-lg font-semibold text-slate-900">
            {products.reduce((total, product) => total + product.quantity, 0)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm font-medium text-slate-700">Total Product Types:</span>
          <span className="text-lg font-semibold text-slate-900">{products.length}</span>
        </div>
      </div>

      {/* Special Handling Summary */}
      {products.some(p => p.specialHandling) && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h5 className="text-sm font-medium text-amber-800 mb-1">Order Contains Items with Special Handling Requirements</h5>
              <ul className="text-xs text-amber-700 space-y-1">
                {products
                  .filter(p => p.specialHandling)
                  .map(p => (
                    <li key={p.id}>• {p.name}: {p.specialHandling}</li>
                  ))
                }
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDisplay; 