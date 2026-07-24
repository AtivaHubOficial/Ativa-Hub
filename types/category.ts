export type CategoryStatus = "active" | "inactive";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: CategoryStatus;
  displayOrder: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
};
