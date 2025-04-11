import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { StatusIcon } from './statusIcons';
import { formatCostShort, formatDateShort, getAbbreviatedAppType } from '../../utils/formatters';

const DevelopmentTable = ({
  getSortedFilteredApplications,
  toggleSort,
  sortField,
  sortDirection,
  flyToPoint,
  getDevelopmentType
}) => {
  return (
    <div className="mt-4 bg-white rounded-lg border shadow-sm overflow-hidden">
      <div className="overflow-x-auto max-h-[70vh] overflow-y-auto relative">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th 
                scope="col" 
                className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => toggleSort('address')}
              >
                <div className="flex items-center">
                  <span>Address</span>
                  {sortField === 'address' && (
                    <ArrowUpDown className={`ml-1 w-4 h-4 ${sortDirection === 'asc' ? 'text-blue-500' : 'text-blue-700'}`} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => toggleSort('type')}
              >
                <div className="flex items-center">
                  <span>Type</span>
                  {sortField === 'type' && (
                    <ArrowUpDown className={`ml-1 w-4 h-4 ${sortDirection === 'asc' ? 'text-blue-500' : 'text-blue-700'}`} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => toggleSort('status')}
              >
                <div className="flex items-center">
                  <span>Status</span>
                  {sortField === 'status' && (
                    <ArrowUpDown className={`ml-1 w-4 h-4 ${sortDirection === 'asc' ? 'text-blue-500' : 'text-blue-700'}`} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                App Type
              </th>
              <th 
                scope="col" 
                className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => toggleSort('cost')}
              >
                <div className="flex items-center">
                  <span>Value</span>
                  {sortField === 'cost' && (
                    <ArrowUpDown className={`ml-1 w-4 h-4 ${sortDirection === 'asc' ? 'text-blue-500' : 'text-blue-700'}`} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => toggleSort('dwellings')}
              >
                <div className="flex items-center justify-center">
                  <span>Dwellings</span>
                  {sortField === 'dwellings' && (
                    <ArrowUpDown className={`ml-1 w-4 h-4 ${sortDirection === 'asc' ? 'text-blue-500' : 'text-blue-700'}`} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => toggleSort('LodgementDate')}
              >
                <div className="flex items-center">
                  <span>Lodged</span>
                  {sortField === 'LodgementDate' && (
                    <ArrowUpDown className={`ml-1 w-4 h-4 ${sortDirection === 'asc' ? 'text-blue-500' : 'text-blue-700'}`} />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm">
            {getSortedFilteredApplications().map(application => (
              <tr 
                key={application.ApplicationId}
                onClick={() => application.Location?.[0]?.X && application.Location?.[0]?.Y && 
                  flyToPoint(application.Location[0].X, application.Location[0].Y)
                }
                className="cursor-pointer hover:bg-blue-50 transition-colors"
              >
                {/* Address Cell */}
                <td className="px-2 py-2 text-sm font-normal text-gray-700 align-top">
                  <div className="flex flex-col" title={application.Location?.[0]?.FullAddress}>
                    <div className="truncate">
                      {(application.Location?.[0]?.StreetNumber1 && application.Location?.[0]?.StreetName) 
                        ? `${application.Location[0].StreetNumber1} ${application.Location[0].StreetName} ${application.Location[0].StreetType || ''}` 
                        : application.Location?.[0]?.FullAddress || 'No address available'}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {(application.Location?.[0]?.Suburb || application.Location?.[0]?.Postcode) 
                        ? `${application.Location[0].Suburb || ''} ${application.Location[0].Postcode || ''}` 
                        : ''}
                    </div>
                  </div>
                </td>
                {/* Development Type Cell */}
                <td className="px-2 py-2 text-sm text-gray-500 align-top">
                  <div className="flex items-center relative group">
                    {getDevelopmentType(application)}
                    {application.DevelopmentType && application.DevelopmentType.length > 1 && (
                      <div className="fixed transform bg-black text-white text-xs rounded-md p-3 opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-xl pointer-events-none max-w-xs max-h-64 overflow-y-auto" style={{ top: 'auto', left: 'auto', bottom: 'auto', right: 'auto', transform: 'translate(0, -100%)' }}>
                        <p className="font-semibold mb-2">Detailed Types:</p>
                        <ul className="list-disc pl-2 pr-2">
                          {application.DevelopmentType.map((type, i) => (
                            <li key={i} className="mb-2">
                              <span className="inline-block w-full break-words whitespace-normal">{type.DevelopmentType}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </td>
                {/* Status Cell */}
                <td className="px-2 py-2 text-sm text-gray-500 align-top">
                  <div className="flex items-center gap-1.5 relative group">
                    <StatusIcon status={application.ApplicationStatus} size={14} />
                    <span className="text-xs text-gray-500">
                      {application.ApplicationStatus}
                    </span>
                    {/* Tooltip removed for brevity, can be added back if needed */}
                  </div>
                </td>
                {/* Application Type Cell */}
                <td className="px-2 py-2 text-sm text-gray-500 align-top">{getAbbreviatedAppType(application.ApplicationType)}</td>
                {/* Value Cell */}
                <td className="px-2 py-2 text-sm text-gray-500 align-top">{formatCostShort(application.CostOfDevelopment)}</td>
                {/* Dwellings Cell */}
                <td className="px-2 py-2 text-sm text-gray-500 text-center align-top">{application.NumberOfNewDwellings || 0}</td>
                {/* Lodged Cell */}
                <td className="px-2 py-2 text-sm text-gray-500 align-top">
                  <span className="whitespace-nowrap">
                    {formatDateShort(application.LodgementDate)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DevelopmentTable; 