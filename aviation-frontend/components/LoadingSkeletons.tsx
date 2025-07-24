import React from 'react';

export const FlightCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
            <div>
              <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
          <div className="h-8 bg-gray-200 rounded-full w-20"></div>
        </div>
      </div>

      {/* Route Section */}
      <div className="px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
          </div>
          
          <div className="flex-1 px-4">
            <div className="h-px bg-gray-200 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-12 mx-auto"></div>
          </div>
          
          <div className="text-center flex-1">
            <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-8"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-12"></div>
                <div className="h-3 bg-gray-200 rounded w-6"></div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="h-4 bg-gray-200 rounded w-16 mb-3"></div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-8"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-12"></div>
                <div className="h-3 bg-gray-200 rounded w-6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LoadingState: React.FC = () => {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <FlightCardSkeleton key={i} />
      ))}
    </div>
  );
};