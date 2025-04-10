import React from 'react';

const SummaryStats = ({ summaryData, formatNumber, formatCurrencyShort }) => {
  return (
    <div className="p-4 bg-gray-50 border-b">
      {/* Key Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div key="total-apps" className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Applications</h3>
          <p className="text-2xl font-bold">{formatNumber(summaryData.totalApplications)}</p>
        </div>
        <div key="total-value" className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Value</h3>
          <p className="text-2xl font-bold">{formatCurrencyShort(summaryData.totalValue)}</p>
        </div>
        <div key="total-dwellings" className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Dwellings</h3>
          <p className="text-2xl font-bold">{formatNumber(summaryData.totalDwellings || 0)}</p>
        </div>
        <div key="determined" className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Determined</h3>
          <p className="text-2xl font-bold">{formatNumber(summaryData.byStatus['Determined'] || 0)}</p>
        </div>
      </div>
    </div>
  );
};

export default SummaryStats; 