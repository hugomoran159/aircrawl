
import React from 'react';
import { Globe, Sparkles } from 'lucide-react';

const Header = () => {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
          <Globe className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Text Extractor
        </h1>
        <Sparkles className="h-6 w-6 text-yellow-500" />
      </div>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
        Extract clean, useful text from any webpage. Simply paste a URL and get the content without the clutter.
      </p>
    </div>
  );
};

export default Header;
