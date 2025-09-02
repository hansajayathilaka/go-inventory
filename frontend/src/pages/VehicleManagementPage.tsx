import React, { useState } from 'react';
import { Car, Tag, Settings, Link as LinkIcon, BarChart3 } from 'lucide-react';
import type { Brand, VehicleBrand, VehicleModelWithBrand, VehicleCompatibilityWithDetails } from '../types/api';

// Import existing components
import BrandList from '../components/BrandList';
import BrandModal from '../components/BrandModal';
import VehicleBrandList from '../components/VehicleBrandList';
import VehicleBrandModal from '../components/VehicleBrandModal';
import VehicleModelList from '../components/VehicleModelList';
import VehicleModelModal from '../components/VehicleModelModal';
import CompatibilityList from '../components/CompatibilityList';
import CompatibilityModal from '../components/CompatibilityModal';
import { api } from '../services/api';

// Import shadcn/ui components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

// Tab definitions
type TabId = 'part-brands' | 'vehicle-brands' | 'vehicle-models' | 'compatibilities' | 'matrix';

interface Tab {
  id: TabId;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const tabs: Tab[] = [
  {
    id: 'part-brands',
    name: 'Part Brands',
    icon: Tag,
    description: 'Manage vehicle spare part manufacturers and brands'
  },
  {
    id: 'vehicle-brands',
    name: 'Vehicle Brands',
    icon: Car,
    description: 'Manage vehicle manufacturers and automotive brands'
  },
  {
    id: 'vehicle-models',
    name: 'Vehicle Models',
    icon: Settings,
    description: 'Manage vehicle models and their specifications'
  },
  {
    id: 'compatibilities',
    name: 'Compatibilities',
    icon: LinkIcon,
    description: 'Manage product-vehicle compatibility relationships'
  },
  {
    id: 'matrix',
    name: 'Compatibility Matrix',
    icon: BarChart3,
    description: 'View comprehensive compatibility matrix and analytics'
  }
];

const VehicleManagementPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('part-brands');
  
  // Part Brands state
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showBrandDeleteModal, setShowBrandDeleteModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [refreshBrands, setRefreshBrands] = useState(0);

  // Vehicle Brands state
  const [showVehicleBrandModal, setShowVehicleBrandModal] = useState(false);
  const [showVehicleBrandDeleteModal, setShowVehicleBrandDeleteModal] = useState(false);
  const [selectedVehicleBrand, setSelectedVehicleBrand] = useState<VehicleBrand | null>(null);
  const [refreshVehicleBrands, setRefreshVehicleBrands] = useState(0);

  // Vehicle Models state
  const [showVehicleModelModal, setShowVehicleModelModal] = useState(false);
  const [showVehicleModelDeleteModal, setShowVehicleModelDeleteModal] = useState(false);
  const [selectedVehicleModel, setSelectedVehicleModel] = useState<VehicleModelWithBrand | null>(null);
  const [refreshVehicleModels, setRefreshVehicleModels] = useState(0);

  // Compatibilities state
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const [showCompatibilityDeleteModal, setShowCompatibilityDeleteModal] = useState(false);
  const [selectedCompatibility, setSelectedCompatibility] = useState<VehicleCompatibilityWithDetails | null>(null);
  const [refreshCompatibilities, setRefreshCompatibilities] = useState(0);

  // Part Brands handlers
  const handleAddBrand = () => {
    setSelectedBrand(null);
    setShowBrandModal(true);
  };

  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand);
    setShowBrandModal(true);
  };

  const handleViewBrand = (brand: Brand) => {
    setSelectedBrand(brand);
    setShowBrandModal(true);
  };

  const handleDeleteBrand = (brand: Brand) => {
    setSelectedBrand(brand);
    setShowBrandDeleteModal(true);
  };

  const handleBrandSaved = () => {
    setRefreshBrands(prev => prev + 1);
  };

  const confirmBrandDelete = async () => {
    if (!selectedBrand) return;
    try {
      await api.brands.delete(selectedBrand.id);
      setRefreshBrands(prev => prev + 1);
      setShowBrandDeleteModal(false);
      setSelectedBrand(null);
      toast({
        title: "Brand deleted",
        description: `"${selectedBrand.name}" has been successfully deleted.`,
      });
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast({
        title: "Error",
        description: "Failed to delete brand. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Vehicle Brands handlers
  const handleAddVehicleBrand = () => {
    setSelectedVehicleBrand(null);
    setShowVehicleBrandModal(true);
  };

  const handleEditVehicleBrand = (vehicleBrand: VehicleBrand) => {
    setSelectedVehicleBrand(vehicleBrand);
    setShowVehicleBrandModal(true);
  };

  const handleViewVehicleBrand = (vehicleBrand: VehicleBrand) => {
    setSelectedVehicleBrand(vehicleBrand);
    setShowVehicleBrandModal(true);
  };

  const handleDeleteVehicleBrand = (vehicleBrand: VehicleBrand) => {
    setSelectedVehicleBrand(vehicleBrand);
    setShowVehicleBrandDeleteModal(true);
  };

  const handleVehicleBrandSaved = () => {
    setRefreshVehicleBrands(prev => prev + 1);
  };

  const confirmVehicleBrandDelete = async () => {
    if (!selectedVehicleBrand) return;
    try {
      await api.vehicleBrands.delete(selectedVehicleBrand.id);
      setRefreshVehicleBrands(prev => prev + 1);
      setShowVehicleBrandDeleteModal(false);
      setSelectedVehicleBrand(null);
      toast({
        title: "Vehicle brand deleted",
        description: `"${selectedVehicleBrand.name}" has been successfully deleted.`,
      });
    } catch (error) {
      console.error('Error deleting vehicle brand:', error);
      toast({
        title: "Error",
        description: "Failed to delete vehicle brand. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Vehicle Models handlers
  const handleAddVehicleModel = () => {
    setSelectedVehicleModel(null);
    setShowVehicleModelModal(true);
  };

  const handleEditVehicleModel = (vehicleModel: VehicleModelWithBrand) => {
    setSelectedVehicleModel(vehicleModel);
    setShowVehicleModelModal(true);
  };

  const handleViewVehicleModel = (vehicleModel: VehicleModelWithBrand) => {
    setSelectedVehicleModel(vehicleModel);
    setShowVehicleModelModal(true);
  };

  const handleDeleteVehicleModel = (vehicleModel: VehicleModelWithBrand) => {
    setSelectedVehicleModel(vehicleModel);
    setShowVehicleModelDeleteModal(true);
  };

  const handleVehicleModelSaved = () => {
    setRefreshVehicleModels(prev => prev + 1);
  };

  const confirmVehicleModelDelete = async () => {
    if (!selectedVehicleModel) return;
    const modelName = selectedVehicleModel.name;
    try {
      await api.vehicleModels.delete(selectedVehicleModel.id);
      setRefreshVehicleModels(prev => prev + 1);
      setShowVehicleModelDeleteModal(false);
      setSelectedVehicleModel(null);
      toast({
        title: "Vehicle model deleted",
        description: `"${modelName}" has been successfully deleted.`,
      });
    } catch (error) {
      console.error('Error deleting vehicle model:', error);
      toast({
        title: "Error",
        description: "Failed to delete vehicle model. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Compatibilities handlers
  const handleAddCompatibility = () => {
    setSelectedCompatibility(null);
    setShowCompatibilityModal(true);
  };

  const handleEditCompatibility = (compatibility: VehicleCompatibilityWithDetails) => {
    setSelectedCompatibility(compatibility);
    setShowCompatibilityModal(true);
  };

  const handleViewCompatibility = (compatibility: VehicleCompatibilityWithDetails) => {
    setSelectedCompatibility(compatibility);
    setShowCompatibilityModal(true);
  };

  const handleDeleteCompatibility = (compatibility: VehicleCompatibilityWithDetails) => {
    setSelectedCompatibility(compatibility);
    setShowCompatibilityDeleteModal(true);
  };

  const handleCompatibilitySaved = () => {
    setRefreshCompatibilities(prev => prev + 1);
  };

  const confirmCompatibilityDelete = async () => {
    if (!selectedCompatibility) return;
    try {
      await api.vehicleCompatibilities.delete(selectedCompatibility.id);
      setRefreshCompatibilities(prev => prev + 1);
      setShowCompatibilityDeleteModal(false);
      setSelectedCompatibility(null);
      toast({
        title: "Compatibility deleted",
        description: "Vehicle compatibility has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting compatibility:', error);
      toast({
        title: "Error",
        description: "Failed to delete compatibility. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper functions
  const formatYearRange = (yearFrom: number, yearTo?: number) => {
    if (yearTo && yearTo !== yearFrom) {
      return `${yearFrom}-${yearTo}`;
    }
    return `${yearFrom}+`;
  };

  const formatProductInfo = (compatibility: VehicleCompatibilityWithDetails) => {
    if (!compatibility.product) return 'Unknown Product';
    return `${compatibility.product.name} (${compatibility.product.sku})`;
  };

  const formatVehicleModelInfo = (compatibility: VehicleCompatibilityWithDetails) => {
    if (!compatibility.vehicle_model) return 'Unknown Vehicle Model';
    const vehicleModel = compatibility.vehicle_model as VehicleModelWithBrand;
    if (!vehicleModel.vehicle_brand) return compatibility.vehicle_model.name || 'Unknown Vehicle Model';
    const brand = vehicleModel.vehicle_brand.name;
    const model = compatibility.vehicle_model.name;
    return `${brand} ${model}`;
  };

  const formatCompatibilityYearRange = (compatibility: VehicleCompatibilityWithDetails) => {
    if (compatibility.year_from && compatibility.year_to) {
      return `${compatibility.year_from}-${compatibility.year_to}`;
    } else if (compatibility.year_from) {
      return `${compatibility.year_from}+`;
    } else if (compatibility.year_to) {
      return `Up to ${compatibility.year_to}`;
    }
    return 'All years';
  };

  // Get current tab info
  const currentTab = tabs.find(tab => tab.id === activeTab)!;

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'part-brands':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <button
                  onClick={handleAddBrand}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Add Part Brand
                </button>
              </div>
            </div>
            <BrandList
              key={refreshBrands}
              onEditBrand={handleEditBrand}
              onViewBrand={handleViewBrand}
              onDeleteBrand={handleDeleteBrand}
            />
          </div>
        );

      case 'vehicle-brands':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <button
                  onClick={handleAddVehicleBrand}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Car className="h-4 w-4 mr-2" />
                  Add Vehicle Brand
                </button>
              </div>
            </div>
            <VehicleBrandList
              key={refreshVehicleBrands}
              onEditVehicleBrand={handleEditVehicleBrand}
              onViewVehicleBrand={handleViewVehicleBrand}
              onDeleteVehicleBrand={handleDeleteVehicleBrand}
            />
          </div>
        );

      case 'vehicle-models':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <button
                  onClick={handleAddVehicleModel}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Add Vehicle Model
                </button>
              </div>
            </div>
            <VehicleModelList
              key={refreshVehicleModels}
              onEditVehicleModel={handleEditVehicleModel}
              onViewVehicleModel={handleViewVehicleModel}
              onDeleteVehicleModel={handleDeleteVehicleModel}
            />
          </div>
        );

      case 'compatibilities':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <button
                  onClick={handleAddCompatibility}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Add Compatibility
                </button>
              </div>
            </div>
            <CompatibilityList
              key={refreshCompatibilities}
              onEditCompatibility={handleEditCompatibility}
              onViewCompatibility={handleViewCompatibility}
              onDeleteCompatibility={handleDeleteCompatibility}
            />
          </div>
        );

      case 'matrix':
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <BarChart3 className="h-5 w-5 text-yellow-400 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Compatibility Matrix Coming Soon
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>The comprehensive compatibility matrix view with analytics and bulk operations will be available in the next update.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vehicle Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Comprehensive vehicle and spare parts management system. Manage brands, models, and compatibility relationships.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                  }`}
                >
                  <Icon
                    className={`-ml-0.5 mr-2 h-5 w-5 transition-colors ${
                      isActive ? 'text-blue-500' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Current tab description */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-700">{currentTab.description}</p>
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Modals */}
      
      {/* Part Brand Modal */}
      <BrandModal
        isOpen={showBrandModal}
        onClose={() => {
          setShowBrandModal(false);
          setSelectedBrand(null);
        }}
        onSave={handleBrandSaved}
        brand={selectedBrand}
      />

      {/* Vehicle Brand Modal */}
      <VehicleBrandModal
        isOpen={showVehicleBrandModal}
        onClose={() => {
          setShowVehicleBrandModal(false);
          setSelectedVehicleBrand(null);
        }}
        onSave={handleVehicleBrandSaved}
        vehicleBrand={selectedVehicleBrand}
      />

      {/* Vehicle Model Modal */}
      <VehicleModelModal
        isOpen={showVehicleModelModal}
        onClose={() => {
          setShowVehicleModelModal(false);
          setSelectedVehicleModel(null);
        }}
        onSave={handleVehicleModelSaved}
        vehicleModel={selectedVehicleModel}
      />

      {/* Compatibility Modal */}
      <CompatibilityModal
        isOpen={showCompatibilityModal}
        onClose={() => {
          setShowCompatibilityModal(false);
          setSelectedCompatibility(null);
        }}
        onSave={handleCompatibilitySaved}
        compatibility={selectedCompatibility}
      />

      {/* Delete Confirmation Dialogs */}
      
      {/* Brand Delete Dialog */}
      <AlertDialog open={showBrandDeleteModal} onOpenChange={setShowBrandDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBrand?.name}"? This action cannot be undone and will remove the brand from all associated products. Products using this brand will have their brand association cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedBrand(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmBrandDelete();
                setSelectedBrand(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Brand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Vehicle Brand Delete Dialog */}
      <AlertDialog open={showVehicleBrandDeleteModal} onOpenChange={setShowVehicleBrandDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedVehicleBrand?.name}"? This action cannot be undone and will remove the vehicle brand from all associated vehicle models. Vehicle models using this brand will have their brand association cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedVehicleBrand(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmVehicleBrandDelete();
                setSelectedVehicleBrand(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Vehicle Brand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Vehicle Model Delete Dialog */}
      <AlertDialog open={showVehicleModelDeleteModal} onOpenChange={setShowVehicleModelDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle Model</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedVehicleModel
                ? `Are you sure you want to delete "${selectedVehicleModel.name}" (${selectedVehicleModel.vehicle_brand.name}, ${formatYearRange(selectedVehicleModel.year_from, selectedVehicleModel.year_to)})? This action cannot be undone and will remove the vehicle model from all associated compatibility records and purchase orders.`
                : 'Are you sure you want to delete this vehicle model?'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedVehicleModel(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmVehicleModelDelete();
                setSelectedVehicleModel(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Vehicle Model
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Compatibility Delete Dialog */}
      <AlertDialog open={showCompatibilityDeleteModal} onOpenChange={setShowCompatibilityDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle Compatibility</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCompatibility
                ? `Are you sure you want to delete the compatibility between "${formatProductInfo(selectedCompatibility)}" and "${formatVehicleModelInfo(selectedCompatibility)}" (${formatCompatibilityYearRange(selectedCompatibility)})? This action cannot be undone and will permanently remove this compatibility relationship.`
                : 'Are you sure you want to delete this compatibility?'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCompatibility(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmCompatibilityDelete();
                setSelectedCompatibility(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Compatibility
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VehicleManagementPage;