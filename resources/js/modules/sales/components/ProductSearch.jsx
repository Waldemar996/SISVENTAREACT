import React, { useState, useEffect, useRef } from 'react';
import Input from '../../../shared/ui/Input.jsx';
import { salesService } from '../services/salesService';

export default function ProductSearch({ onProductSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);

    // Debounce Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length >= 2) {
                performSearch(query);
            } else {
                setResults([]);
                setShowResults(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [query]);

    const performSearch = async (searchTerm) => {
        setLoading(true);
        try {
            const response = await salesService.searchProducts(searchTerm);
            setResults(response.data); // Assuming backend returns array directly or inside data key
            setShowResults(true);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (product) => {
        onProductSelect(product);
        setQuery('');
        setResults([]);
        setShowResults(false);
        // Focus back to input if needed
    };

    return (
        <div className="relative w-full" ref={searchRef}>
            <Input
                label="Buscar Producto"
                placeholder="Código, Nombre o SKU..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
            />

            {/* Results Dropdown */}
            {showResults && results.length > 0 && (
                <div className="absolute z-50 w-full bg-white mt-1 border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {results.map((product) => (
                        <div
                            key={product.id}
                            onClick={() => handleSelect(product)}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                        >
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-800">{product.nombre}</span>
                                <span className="font-bold text-blue-600">Q{product.precio_venta_base}</span>
                            </div>
                            <div className="text-xs text-gray-500 flex justify-between">
                                <span>SKU: {product.codigo_sku}</span>
                                <span>Stock: {product.stock_total ?? 'N/A'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {loading && <div className="absolute right-3 top-9 text-gray-400 text-xs">Cargando...</div>}
        </div>
    );
}
