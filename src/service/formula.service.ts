import { apiRequest } from "@/lib/axios-instance";
import { FormularResponse } from "@/types/formula";

export const getAutoComplete = () => {
  return apiRequest<FormularResponse[]>({
    method: "GET",
    url: "/autocomplete",
  });
};
