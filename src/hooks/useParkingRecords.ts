
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ParkingRecord } from "@/types/parking";

// For timestamps (entry/exit) use ISO
const toISO = (d?: Date) => d ? d.toISOString() : undefined;

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
      const insertObj = {
        vehicle_number: newRecord.vehicleNumber,
        vehicle_type: newRecord.vehicleType,
        entry_time: toISO(newRecord.entryTime) ?? "",
        status: "active",
        is_pass_holder: newRecord.isPassHolder,
        pass_id: newRecord.passId,
        user_id: userId!,
      };
      const { data, error } = await supabase
        .from("parking_records")
        .insert([insertObj])
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
      // Prepare update object with fields mapped to snake_case and convert Dates to ISO string
      const updateObj: { [key: string]: any } = {};
      if ("exitTime" in fields && fields.exitTime)
        updateObj.exit_time = toISO(fields.exitTime);
      if ("duration" in fields && typeof fields.duration === "number")
        updateObj.duration = fields.duration;
      if ("amountDue" in fields)
        updateObj.amount_due = fields.amountDue;
      if ("status" in fields)
        updateObj.status = fields.status;
      if ("isPassHolder" in fields)
        updateObj.is_pass_holder = fields.isPassHolder;
      if ("passId" in fields)
        updateObj.pass_id = fields.passId;

      const { data, error } = await supabase
        .from("parking_records")
        .update(updateObj)
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

