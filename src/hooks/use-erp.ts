import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getErpFinancials, getErpOverview, runAiLeakageAnalysis } from "@/lib/erp.functions";

/** Real imported invoices, payments and vendors for the signed-in user. */
export function useErpFinancials() {
  const fetchFinancials = useServerFn(getErpFinancials);
  return useQuery({
    queryKey: ["erp", "financials"],
    queryFn: () => fetchFinancials(),
    staleTime: 30_000,
  });
}

/** Aggregates, findings and insights computed from the imported records. */
export function useErpOverview() {
  const fetchOverview = useServerFn(getErpOverview);
  return useQuery({
    queryKey: ["erp", "overview"],
    queryFn: () => fetchOverview(),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });
}

export function useAiLeakageAnalysis() {
  const runAnalysis = useServerFn(runAiLeakageAnalysis);
  return useQuery({
    queryKey: ["erp", "ai-leakage-analysis"],
    queryFn: () => runAnalysis(),
    enabled: false,
    retry: false,
  });
}
