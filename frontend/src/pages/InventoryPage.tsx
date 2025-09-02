import React, { useState } from 'react';
import InventoryList from '../components/InventoryList';
import StockAdjustmentModal from '../components/StockAdjustmentModal';
import type { InventoryRecord } from '../types/api';

const InventoryPage: React.FC = () => {
  const [selectedRecord, setSelectedRecord] = useState<InventoryRecord | undefined>();
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleStockAdjust = (record: InventoryRecord) => {
    setSelectedRecord(record);
    setShowAdjustmentModal(true);
  };

  const handleViewDetails = (record: InventoryRecord) => {
    // For now, just log the record. In future, could open a detailed view modal
    console.log('View details for:', record);
  };

  const handlePOSLookup = (record: InventoryRecord) => {
    // Future POS integration - quick lookup for sales
    console.log('POS lookup for:', record.product?.name, record.product?.barcode);
  };

  const handleModalSuccess = () => {
    // Trigger refresh of inventory list
    setRefreshTrigger(prev => prev + 1);
  };

  const closeModal = () => {
    setShowAdjustmentModal(false);
    setSelectedRecord(undefined);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hardware Store Inventory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track stock levels, manage inventory, and prepare for point-of-sale operations.
        </p>
      </div>

      {/* Main inventory list with hardware store functionality */}
      <InventoryList
        onStockAdjust={handleStockAdjust}
        onViewDetails={handleViewDetails}
        onPOSLookup={handlePOSLookup}
        key={refreshTrigger} // Force refresh when this changes
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={showAdjustmentModal}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
        inventoryRecord={selectedRecord}
      />
    </div>
  );
};

export default InventoryPage;