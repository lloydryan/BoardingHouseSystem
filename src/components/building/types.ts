export type BuildingUnit = {
  id: string;
  floorId: string;
  unitNumber: string;
  unitName?: string;
  unitType: string;
  status: string;
  monthlyRent: number;
  occupancy: number;
  maximumOccupants: number;
  primaryTenant: string;
  outstandingBalance: number;
  billingStatus: string;
  electricityStatus: string;
  waterStatus: string;
};

export type BuildingFloor = {
  id: string;
  name: string;
  floorNumber: number;
  displayOrder: number;
  status: string;
  summary?: {
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    reservedUnits: number;
    maintenanceUnits: number;
    expectedRent: number;
    collected: number;
    outstanding: number;
  };
  units: BuildingUnit[];
};

export type BuildingProperty = {
  id: string;
  name: string;
  code?: string;
  address?: string;
  buildingViewTemplate?: string;
};
