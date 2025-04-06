import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "./lib/query-client";
import FormulaInput from "./components/FormulaInput";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FormulaInput />
    </QueryClientProvider>
  );
}
