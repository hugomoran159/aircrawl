import React from 'react';
import { Globe, Sparkles } from 'lucide-react';

const Header = () => {
  return (
    <div className="text-center mb-10 md:mb-12">
      <div className="flex items-center justify-center gap-3 mb-3">
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-800">
          💨 Aircrawl
        </h1>
        <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-yellow-400 opacity-0" />
      </div>
      <p className="text-base md:text-lg text-gray-500 max-w-xl mx-auto">
        Aircrawl provides powerful tools to extract clean, comprehensive text from websites, perfect for feeding rich context to Large Language Models.
      </p>
    </div>
  );
};

export default Header;
