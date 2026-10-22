export type ToolCategory = 'security' | 'identity' | 'office' | 'media';

export interface ToolDefinition {
  id: string;
  name: string;
  nameEn: string;
  category: ToolCategory;
  iconName: string;
  description: string;
  badge?: string;
  keywords: string[];
  featured?: boolean;
}

export interface CategoryDefinition {
  id: ToolCategory;
  name: string;
  nameEn: string;
  iconName: string;
  description: string;
}
