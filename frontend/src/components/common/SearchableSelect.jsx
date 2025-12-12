import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder = 'Search...', displayKey = 'label', valueKey = 'value', searchKeys = [], disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const getDisplayValue = (option) => {
    if (typeof option === 'string') return option;
    if (typeof option === 'object') {
      if (displayKey.includes('.')) {
        const keys = displayKey.split('.');
        return keys.reduce((obj, key) => obj?.[key], option) || '';
      }
      return option[displayKey] || option.label || option.name || String(option);
    }
    return String(option);
  };

  const getValue = (option) => {
    if (typeof option === 'object') {
      if (valueKey.includes('.')) {
        const keys = valueKey.split('.');
        return keys.reduce((obj, key) => obj?.[key], option) || '';
      }
      return option[valueKey] || option.value || option.id || option;
    }
    return option;
  };

  const matchesSearch = (option) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    
    // Search in display value
    const displayValue = getDisplayValue(option).toLowerCase();
    if (displayValue.includes(term)) return true;

    // Search in additional keys if provided
    if (typeof option === 'object' && searchKeys.length > 0) {
      return searchKeys.some(key => {
        const value = option[key];
        return value && String(value).toLowerCase().includes(term);
      });
    }

    // Search all string values in object if no specific keys provided
    if (typeof option === 'object') {
      return Object.values(option).some(val => 
        val && String(val).toLowerCase().includes(term)
      );
    }

    return false;
  };

  const filteredOptions = options.filter(matchesSearch);

  const handleSelect = (option) => {
    onChange(getValue(option));
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
    }
  };

  const selectedOption = options.find(opt => getValue(opt) === value);
  const displayText = selectedOption ? getDisplayValue(selectedOption) : '';

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent flex items-center justify-between ${
          disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'cursor-pointer bg-white'
        }`}
      >
        <div className="flex items-center flex-1 min-w-0">
          {!isOpen && displayText && (
            <span className="text-sm text-gray-900 truncate">{displayText}</span>
          )}
          {!isOpen && !displayText && (
            <span className="text-sm text-gray-400">{placeholder}</span>
          )}
          {isOpen && (
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              className="w-full text-sm text-gray-900 bg-transparent border-0 outline-none"
              placeholder={placeholder}
            />
          )}
        </div>
        <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
          {isOpen && searchTerm && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSearchTerm('');
                setHighlightedIndex(-1);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
          {!isOpen && (
            <Search className="w-4 h-4 text-gray-400" />
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No options found
            </div>
          ) : (
            filteredOptions.map((option, index) => {
              const optionValue = getValue(option);
              const optionLabel = getDisplayValue(option);
              const isSelected = optionValue === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={optionValue}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-900 font-semibold'
                      : isHighlighted
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {optionLabel}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;

