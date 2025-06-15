
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MonthlyPass } from "@/types/parking";

// Date to YYYY-MM-DD string for SQL
const toDateString = (d?: Date) => (d ? d.toISOString().split("T")[0] : undefined);

export function useMonthlyPasses(userId: string | undefined) {
  const queryClient = useQueryClient();

  const monthlyPassesQuery = useQuery({
    queryKey: ["monthly_passes", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("monthly_passes")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw new Error(error.message);

      return data?.map((pass) => ({
        ...pass,
        startDate: pass.start_date ? new Date(pass.start_date) : undefined,
        endDate: pass.end_date ? new Date(pass.end_date) : undefined,
        amount: pass.amount,
        vehicleNumber: pass.vehicle_number,
        vehicleType: pass.vehicle_type as 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler',
        passType: pass.pass_type as 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler',
        ownerName: pass.owner_name,
        ownerPhone: pass.owner_phone,
        status: pass.status,
        id: pass.id,
      })) as MonthlyPass[];
    },
    enabled: !!userId,
  });

  const createMonthlyPass = useMutation({
    mutationFn: async (newPass: Omit<MonthlyPass, "id">) => {
      const insertObj = {
        vehicle_number: newPass.vehicleNumber,
        pass_type: newPass.passType,
        vehicle_type: newPass.vehicleType,
        owner_name: newPass.ownerName,
        owner_phone: newPass.ownerPhone,
        start_date: toDateString(newPass.startDate) ?? "",
        end_date: toDateString(newPass.endDate) ?? "",
        amount: newPass.amount,
        status: newPass.status || "active",
        user_id: userId!,
      };
      const { data, error } = await supabase
        .from("monthly_passes")
        .insert([insertObj])
        .select("*")
        .single();
      if (error) throw new Error(error.message);

      return {
        ...data,
        startDate: data.start_date ? new Date(data.start_date) : undefined,
        endDate: data.end_date ? new Date(data.end_date) : undefined,
        amount: data.amount,
        vehicleNumber: data.vehicle_number,
        vehicleType: data.vehicle_type as 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler',
        passType: data.pass_type as 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler',
        ownerName: data.owner_name,
        ownerPhone: data.owner_phone,
        status: data.status,
        id: data.id,
      } as MonthlyPass;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly_passes", userId] });
    },
  });

  return {
    monthlyPasses: monthlyPassesQuery.data ?? [],
    isLoading: monthlyPassesQuery.isLoading,
    error: monthlyPassesQuery.error,
    createMonthlyPass,
    refetch: monthlyPassesQuery.refetch,
  };
}
