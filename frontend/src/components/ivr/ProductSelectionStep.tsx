import React, { useState } from 'react';
import { Product, mockProducts } from '../../types/ivr';

interface SelectedProduct {
  id: string;
  name: string;
  category: string;
  size?: string;
  quantity: number;
}

interface ProductSelectionStepProps {
  selectedProducts: SelectedProduct[];
  onProductsChange: (products: SelectedProduct[]) => void;
}

const ProductSelectionStep: React.FC<ProductSelectionStepProps> = ({
  selectedProducts,
  onProductsChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = (product: Product) => {
    const existingProduct = selectedProducts.find(p => p.id === product.id);
    if (existingProduct) {
      onProductsChange(
        selectedProducts.map(p =>
          p.id === product.id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      );
    } else {
      onProductsChange([
        ...selectedProducts,
        {
          id: product.id,
          name: product.name,
          category: product.category,
          size: product.size,
          quantity: 1
        }
      ]);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter(p => p.id !== productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) {
      handleRemoveProduct(productId);
      return;
    }

    onProductsChange(
      selectedProducts.map(p =>
        p.id === productId
          ? { ...p, quantity }
          : p
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Product Selection</h3>
        
        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-4 py-2 focus:border-[#2C3E50] focus:ring-[#2C3E50]"
          />
        </div>

        {/* Product List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="border rounded-lg p-4 hover:border-[#2C3E50] transition-colors"
            >
              <h4 className="font-medium text-gray-900">{product.name}</h4>
              <p className="text-sm text-gray-500 mt-1">{product.description}</p>
              {product.size && (
                <p className="text-sm text-gray-500">Size: {product.size}</p>
              )}
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">
                  Code: {product.code}
                </span>
                <button
                  type="button"
                  onClick={() => handleAddProduct(product)}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-[#2C3E50] hover:bg-[#375788]"
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Products */}
        {selectedProducts.length > 0 && (
          <div className="mt-8">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Selected Products</h4>
            <div className="space-y-4">
              {selectedProducts.map(product => (
                <div
                  key={product.id}
                  className="flex items-center justify-between border rounded-lg p-4"
                >
                  <div>
                    <h5 className="font-medium text-gray-900">{product.name}</h5>
                    {product.size && (
                      <p className="text-sm text-gray-500">Size: {product.size}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(product.id, product.quantity - 1)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={product.quantity}
                        onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                        className="w-16 text-center rounded-md border border-gray-300 px-2 py-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(product.id, product.quantity + 1)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(product.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSelectionStep; 