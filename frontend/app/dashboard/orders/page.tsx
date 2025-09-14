"use client";
import { useDashboard } from '../DashboardContext';
import { OrdersClient } from './OrdersClient';

export default function OrdersPage() {
  const { selectedTenant } = useDashboard();

  if (!selectedTenant) {
    return (
        <div className="text-center p-10 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-700">No Store Selected</h2>
            <p className="text-gray-500 mt-2">Please select a store from the dropdown to view its orders.</p>
        </div>
    );
}
  return (
    <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Order History</h1>
        <OrdersClient 
            initialOrders={selectedTenant ? selectedTenant.orders.map(o => ({...o, storeUrl: selectedTenant.storeUrl})) : []} 
        />
    </div>
  );
}