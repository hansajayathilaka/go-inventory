import type { CategoryWithMeta, IconConfig } from '../types';
import { DEFAULT_ICON_CONFIG } from '../types';

/**
 * Get icon for a category based on various criteria
 */
export function getCategoryIcon(
  category: CategoryWithMeta,
  iconConfig: IconConfig = DEFAULT_ICON_CONFIG
): string {
  // 1. Check for specific category ID mapping
  if (iconConfig.categoryIcons[category.id]) {
    return iconConfig.categoryIcons[category.id];
  }

  // 2. Check for category name mapping (case-insensitive)
  const nameKey = category.name.toLowerCase();
  if (iconConfig.categoryIcons[nameKey]) {
    return iconConfig.categoryIcons[nameKey];
  }

  // 3. Check for partial name matches
  const partialMatch = Object.keys(iconConfig.categoryIcons).find(key => 
    nameKey.includes(key.toLowerCase()) || key.toLowerCase().includes(nameKey)
  );
  if (partialMatch) {
    return iconConfig.categoryIcons[partialMatch];
  }

  // 4. Check for level-based icons
  if (iconConfig.levelIcons[category.level]) {
    return iconConfig.levelIcons[category.level];
  }

  // 5. Return default icon
  return iconConfig.defaultIcon;
}

/**
 * Get expand/collapse icon based on node state
 */
export function getExpandIcon(
  category: CategoryWithMeta,
  iconConfig: IconConfig = DEFAULT_ICON_CONFIG
): string | null {
  // Only show expand/collapse icon if category has children
  if (!category.children || category.children.length === 0) {
    return null;
  }

  return category.isExpanded ? iconConfig.collapseIcon : iconConfig.expandIcon;
}

/**
 * Create icon element HTML
 */
export function createIconElement(
  iconClass: string,
  additionalClasses: string = '',
  ariaLabel?: string
): string {
  const classes = `${iconClass} ${additionalClasses}`.trim();
  const aria = ariaLabel ? `aria-label="${ariaLabel}"` : '';
  
  return `<i class="${classes}" ${aria}></i>`;
}

/**
 * Build complete icon configuration from partial config
 */
export function buildIconConfig(partialConfig?: Partial<IconConfig>): IconConfig {
  return {
    ...DEFAULT_ICON_CONFIG,
    ...partialConfig,
    categoryIcons: {
      ...DEFAULT_ICON_CONFIG.categoryIcons,
      ...partialConfig?.categoryIcons
    },
    levelIcons: {
      ...DEFAULT_ICON_CONFIG.levelIcons,
      ...partialConfig?.levelIcons
    }
  };
}

/**
 * Automotive-specific icon mapping
 */
export const AUTOMOTIVE_CATEGORY_ICONS: Record<string, string> = {
  // Engine components
  'engine': 'fas fa-cog',
  'engines': 'fas fa-cog',
  'pistons': 'fas fa-circle',
  'valves': 'fas fa-circle',
  'gaskets': 'fas fa-circle',
  'timing': 'fas fa-clock',
  
  // Transmission & Drivetrain
  'transmission': 'fas fa-tools',
  'gearbox': 'fas fa-tools',
  'clutch': 'fas fa-circle',
  'differential': 'fas fa-cog',
  'driveshaft': 'fas fa-grip-lines',
  'axle': 'fas fa-grip-lines',
  
  // Braking System
  'brakes': 'fas fa-circle',
  'brake pads': 'fas fa-square',
  'brake discs': 'fas fa-circle',
  'brake fluid': 'fas fa-tint',
  'abs': 'fas fa-microchip',
  
  // Suspension System
  'suspension': 'fas fa-car-side',
  'shocks': 'fas fa-compress-arrows-alt',
  'struts': 'fas fa-compress-arrows-alt',
  'springs': 'fas fa-compress-arrows-alt',
  'bushings': 'fas fa-circle',
  
  // Electrical System
  'electrical': 'fas fa-bolt',
  'battery': 'fas fa-battery-full',
  'alternator': 'fas fa-circle',
  'starter': 'fas fa-play',
  'ignition': 'fas fa-fire',
  'lights': 'fas fa-lightbulb',
  'wiring': 'fas fa-project-diagram',
  
  // Body & Exterior
  'body': 'fas fa-car',
  'doors': 'fas fa-door-open',
  'windows': 'fas fa-window-maximize',
  'mirrors': 'fas fa-mirror',
  'bumpers': 'fas fa-car',
  'panels': 'fas fa-square',
  
  // Interior
  'interior': 'fas fa-couch',
  'seats': 'fas fa-chair',
  'dashboard': 'fas fa-tachometer-alt',
  'steering': 'fas fa-steering-wheel',
  'pedals': 'fas fa-shoe-prints',
  
  // Cooling System
  'cooling': 'fas fa-snowflake',
  'radiator': 'fas fa-th-large',
  'coolant': 'fas fa-tint',
  'thermostat': 'fas fa-thermometer-half',
  'water pump': 'fas fa-sync-alt',
  
  // Fuel System
  'fuel': 'fas fa-gas-pump',
  'fuel pump': 'fas fa-gas-pump',
  'fuel filter': 'fas fa-filter',
  'injectors': 'fas fa-syringe',
  
  // Exhaust System
  'exhaust': 'fas fa-cloud',
  'muffler': 'fas fa-volume-down',
  'catalytic': 'fas fa-recycle',
  'manifold': 'fas fa-project-diagram',
  
  // Filters & Maintenance
  'filters': 'fas fa-filter',
  'air filter': 'fas fa-wind',
  'oil filter': 'fas fa-filter',
  'cabin filter': 'fas fa-air-freshener',
  
  // Fluids & Lubricants
  'fluids': 'fas fa-tint',
  'oil': 'fas fa-tint',
  'lubricants': 'fas fa-tint',
  'hydraulic': 'fas fa-tint',
  
  // Belts & Hoses
  'belts': 'fas fa-grip-lines',
  'hoses': 'fas fa-grip-lines',
  'timing belt': 'fas fa-grip-lines',
  'serpentine': 'fas fa-grip-lines',
  
  // Tools & Equipment
  'tools': 'fas fa-wrench',
  'diagnostic': 'fas fa-stethoscope',
  'lifting': 'fas fa-hand-rock',
  'measuring': 'fas fa-ruler',
  
  // Safety & Security
  'safety': 'fas fa-shield-alt',
  'airbags': 'fas fa-shield-alt',
  'seatbelts': 'fas fa-user-shield',
  'locks': 'fas fa-lock',
  'alarms': 'fas fa-bell',
  
  // HVAC (Heating, Ventilation, Air Conditioning)
  'hvac': 'fas fa-fan',
  'air conditioning': 'fas fa-snowflake',
  'heating': 'fas fa-fire',
  'ventilation': 'fas fa-fan',
  'climate': 'fas fa-thermometer-half',
  
  // Wheels & Tires
  'wheels': 'fas fa-circle',
  'tires': 'fas fa-circle',
  'rims': 'fas fa-circle',
  'wheel bearings': 'fas fa-circle'
};

/**
 * Get icon color based on category type or level
 */
export function getIconColor(
  category: CategoryWithMeta,
  theme: 'light' | 'dark' = 'light'
): string {
  const colorMap = {
    light: {
      0: 'text-blue-600',      // Root categories
      1: 'text-green-600',     // Main subcategories
      2: 'text-yellow-600',    // Sub-subcategories
      default: 'text-gray-600'
    },
    dark: {
      0: 'text-blue-400',
      1: 'text-green-400',
      2: 'text-yellow-400',
      default: 'text-gray-400'
    }
  };

  const colors = colorMap[theme];
  return colors[category.level as keyof typeof colors] || colors.default;
}

/**
 * Get icon size based on category level
 */
export function getIconSize(category: CategoryWithMeta): string {
  const sizeMap = {
    0: 'text-lg',      // Root categories - larger
    1: 'text-base',    // Main subcategories - normal
    2: 'text-sm',      // Sub-subcategories - smaller
  };

  return sizeMap[category.level as keyof typeof sizeMap] || 'text-sm';
}

/**
 * Check if an icon class is valid Font Awesome class
 */
export function isValidFontAwesome(iconClass: string): boolean {
  // Basic validation for Font Awesome classes
  const faPattern = /^(fa[srb]?|fas|far|fab|fal|fad)\s+fa-[\w-]+/;
  return faPattern.test(iconClass);
}

/**
 * Fallback to default icon if provided icon is invalid
 */
export function getValidIcon(
  iconClass: string,
  fallback: string = DEFAULT_ICON_CONFIG.defaultIcon
): string {
  return isValidFontAwesome(iconClass) ? iconClass : fallback;
}

/**
 * Create icon configuration for specific industry/domain
 */
export function createDomainIconConfig(
  domain: 'automotive' | 'electronics' | 'general',
  baseConfig?: Partial<IconConfig>
): IconConfig {
  let domainIcons: Record<string, string>;

  switch (domain) {
    case 'automotive':
      domainIcons = AUTOMOTIVE_CATEGORY_ICONS;
      break;
    case 'electronics':
      domainIcons = {
        'electronics': 'fas fa-microchip',
        'computers': 'fas fa-desktop',
        'mobile': 'fas fa-mobile-alt',
        'audio': 'fas fa-headphones',
        'video': 'fas fa-video',
        'cables': 'fas fa-plug',
        'accessories': 'fas fa-puzzle-piece'
      };
      break;
    default:
      domainIcons = {};
  }

  return buildIconConfig({
    ...baseConfig,
    categoryIcons: {
      ...domainIcons,
      ...baseConfig?.categoryIcons
    }
  });
}