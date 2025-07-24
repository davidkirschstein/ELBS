import React, { useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react-native';

interface SearchBarProps {
  flightNumber: string;
  onFlightNumberChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  loading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  flightNumber,
  onFlightNumberChange,
  onSearch,
  onClear,
  loading
}) => {
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className={`relative flex items-center bg-white border rounded-xl overflow-hidden transition-all duration-200 ${
        focused ? 'border-blue-300 shadow-lg ring-4 ring-blue-50' : 'border-gray-200 shadow-sm'
      }`}>
        <div className="pl-4 pr-3 py-3">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={flightNumber}
          onChange={(e) => onFlightNumberChange(e.target.value.toUpperCase())}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Enter flight number (e.g., AA123)"
          className="flex-1 py-3 text-gray-900 placeholder-gray-500 focus:outline-none"
        />
        
        {flightNumber && (
          <button
            type="button"
            onClick={onClear}
            className="px-3 py-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        <button
          type="submit"
          disabled={loading || !flightNumber.trim()}
          className="px-6 py-3 bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>
    </form>
  );
};

export default SearchBar;