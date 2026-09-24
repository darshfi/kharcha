export interface Category {
  id: string;
  name: string;
  icon: string; // emoji or icon name
  color: string; // hex color code
  isCustom: boolean;
  isArchived: boolean;
  orderIndex: number;
  createdAt: string;
}

export interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
  isCustom?: boolean;
  isArchived?: boolean;
  orderIndex?: number;
}