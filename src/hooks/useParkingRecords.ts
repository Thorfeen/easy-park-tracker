
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ParkingRecord } from "@/types/parking";

export function useParkingRecords(userId: string | undefined) {
  const queryClient = useQueryClient();

  const parkingRecordsQuery = useQuery({
    queryKey: ["parking_records", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("parking_records")
        .select("*")
        .order("entry_time", { ascending: false });

      if (error) throw new Error(error.message);

      // Convert string timestamps to Date objects for compatibility with the app
      return data?.map((rec) => ({
        ...rec,
        entryTime: rec.entry_time ? new Date(rec.entry_time) : undefined,
        exitTime: rec.exit_time ? new Date(rec.exit_time) : undefined,
        duration: rec.duration,
        amountDue: rec.amount_due,
        vehicleNumber: rec.vehicle_number,
        vehicleType: rec.vehicle_type,
        status: rec.status,
        isPassHolder: rec.is_pass_holder,
        passId: rec.pass_id,
        id: rec.id,
      })) as ParkingRecord[];
    },
    enabled: !!userId,
  });

  const createParkingRecord = useMutation({
    mutationFn: async (newRecord: Omit<ParkingRecord, "id" | "exitTime" | "duration" | "amountDue">) => {
      const { data, error } = await supabase
        .from("parking_records")
        .insert([
          {
            vehicle_number: newRecord.vehicleNumber,
            vehicle_type: newRecord.vehicleType,
            entry_time: newRecord.entryTime,
            status: "active",
            is_pass_holder: newRecord.isPassHolder,
            pass_id: newRecord.passId,
            user_id: userId,
          },
        ])
        .select("*")
        .single();

      if (error) throw new Error(error.message);

      return {
        ...data,
        entryTime: data.entry_time ? new Date(data.entry_time) : undefined,
        exitTime: data.exit_time ? new Date(data.exit_time) : undefined,
        duration: data.duration,
        amountDue: data.amount_due,
        vehicleNumber: data.vehicle_number,
        vehicleType: data.vehicle_type,
        status: data.status,
        isPassHolder: data.is_pass_holder,
        passId: data.pass_id,
        id: data.id,
      } as ParkingRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking_records", userId] });
    },
  });

  const updateParkingRecord = useMutation({
    mutationFn: async ({
      recordId,
      fields,
    }: {
      recordId: string;
      fields: Partial<ParkingRecord>;
    }) => {
      const { data, error } = await supabase
        .from("parking_records")
        .update({
          ...("exitTime" in fields ? { exit_time: fields.exitTime } : {}),
          ...("duration" in fields ? { duration: fields.duration } : {}),
          ...("amountDue" in fields ? { amount_due: fields.amountDue } : {}),
          ...("status" in fields ? { status: fields.status } : {}),
          ...("isPassHolder" in fields ? { is_pass_holder: fields.isPassHolder } : {}),
        })
        .eq("id", recordId)
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking_records", userId] });
    },
  });

  return {
    parkingRecords: parkingRecordsQuery.data ?? [],
    isLoading: parkingRecordsQuery.isLoading,
    error: parkingRecordsQuery.error,
    createParkingRecord,
    updateParkingRecord,
    refetch: parkingRecordsQuery.refetch,
  };
}
