export interface FormularResponse {
  name: string;
  category: string;
  value: number | string;
  id: string;
  inputs?: string;
}

export interface GroupedOptions {
  [category: string]: FormularResponse[];
}
