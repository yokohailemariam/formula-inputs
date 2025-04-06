import { getAutoComplete } from "@/service/formula.service";
import { useQuery } from "@tanstack/react-query";

export const useGetAutoComplete = () => {
  return useQuery({
    queryKey: ["autocomplete"],
    queryFn: getAutoComplete,
  });
};
