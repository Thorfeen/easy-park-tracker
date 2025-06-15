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
      if (!userId) {
        console.log("No userId provided, returning empty passes.");
        return [];
      }
      const { data, error } = await supabase
        .from("monthly_passes")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) {
        console.error("Error fetching monthly passes:", error);
        throw new Error(error.message);
      }

      const passes = data?.map((pass) => ({
        ...pass,
        startDate: pass.start_date ? new Date(pass.start_date) : undefined,
        endDate: pass.end_date ? new Date(pass.end_date) : undefined,
        amount: pass.amount,
        vehicleNumber: pass.vehicle_number,
        vehicleType: pass.vehicle_type,
        passType: pass.pass_type,
        ownerName: pass.owner_name,
        ownerPhone: pass.owner_phone,
        status: pass.status,
        id: pass.id,
      })) as MonthlyPass[];
      console.log("Fetched passes:", passes);
      return passes;
    },
    enabled: !!userId,
  });

  const createMonthlyPass = useMutation({
    mutationFn: async (newPass: Omit<MonthlyPass, "id">) => {
      if (!userId) {
        console.error("No userId provided, not inserting monthly pass");
        throw new Error("No userId");
      }
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
        user_id: userId,
      };
      console.log("Inserting monthly pass:", insertObj);
      const { data, error } = await supabase
        .from("monthly_passes")
        .insert([insertObj])
        .select("*")
        .single();
      if (error) {
        console.error("Supabase error inserting pass:", error);
        throw new Error(error.message);
      }
      console.log("Inserted monthly pass (raw):", data);

      return {
        ...data,
        startDate: data.start_date ? new Date(data.start_date) : undefined,
        endDate: data.end_date ? new Date(data.end_date) : undefined,
        amount: data.amount,
        vehicleNumber: data.vehicle_number,
        vehicleType: data.vehicle_type,
        passType: data.pass_type,
        ownerName: data.owner_name,
        ownerPhone: data.owner_phone,
        status: data.status,
        id: data.id,
      } as MonthlyPass;
    },
    onSuccess: (data) => {
      console.log("Successfully created monthly pass:", data);
      queryClient.invalidateQueries({ queryKey: ["monthly_passes", userId] });
    },
    onError: (error) => {
      console.error("Error creating monthly pass:", error);
    }
  });

  return {
    monthlyPasses: monthlyPassesQuery.data ?? [],
    isLoading: monthlyPassesQuery.isLoading,
    error: monthlyPassesQuery.error,
    createMonthlyPass,
    refetch: monthlyPassesQuery.refetch,
  };
}
