
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ParkingRecord } from "@/types/parking";

// Use type as per Supabase table (all possible fields, required for insert)
type RawRecord = {
  id: number;
  vehicle_number: string;
  vehicle_type: string;
  entry_time: string;
  exit_time: string | null;
  duration: number | null;
  amount_due: number | null;
  status: string;
  is_pass_holder: boolean | null;
  pass_id: string | null;
  calculation_breakdown: any | null; // should be Json compatible
  helmet: boolean | null;
  created_at: string | null;
};

function toAppRecord(raw: RawRecord): ParkingRecord {
  return {
    id: String(raw.id),
    vehicleNumber: raw.vehicle_number,
    vehicleType: raw.vehicle_type as ParkingRecord["vehicleType"],
    entryTime: new Date(raw.entry_time),
    exitTime: raw.exit_time ? new Date(raw.exit_time) : undefined,
    duration: raw.duration || undefined,
    amountDue: raw.amount_due || undefined,
    status: raw.status as ParkingRecord["status"],
    isPassHolder: !!raw.is_pass_holder,
    passId: raw.pass_id || undefined,
    calculationBreakdown:
      Array.isArray(raw.calculation_breakdown)
        ? raw.calculation_breakdown
        : (raw.calculation_breakdown ? [String(raw.calculation_breakdown)] : undefined),
    helmet: !!raw.helmet,
  };
}

// Build a complete insert object for addEntry. For updates, use partials.
function toRawInsert(record: Omit<ParkingRecord, "id" | "status"> & { status?: ParkingRecord["status"] }): RawRecord {
  return {
    // id and created_at handled by DB defaults
    vehicle_number: record.vehicleNumber,
    vehicle_type: record.vehicleType,
    entry_time: record.entryTime.toISOString(),
    exit_time: record.exitTime ? record.exitTime.toISOString() : null,
    duration: record.duration ?? null,
    amount_due: record.amountDue ?? null,
    status: record.status ?? "active",
    is_pass_holder: record.isPassHolder ?? false,
    pass_id: record.passId ?? null,
    calculation_breakdown: record.calculationBreakdown ?? null,
    helmet: record.helmet ?? null,
    created_at: null // let DB set default
  };
}

// For updates only, can be partial
function fromAppRecord(record: Partial<ParkingRecord>): Partial<RawRecord> {
  return {
    vehicle_number: record.vehicleNumber,
    vehicle_type: record.vehicleType,
    entry_time: record.entryTime ? record.entryTime.toISOString() : undefined,
    exit_time: record.exitTime ? record.exitTime.toISOString() : undefined,
    duration: record.duration,
    amount_due: record.amountDue,
    status: record.status,
    is_pass_holder: record.isPassHolder,
    pass_id: record.passId,
    calculation_breakdown: record.calculationBreakdown ? record.calculationBreakdown : undefined,
    helmet: record.helmet,
    // created_at handled by db default
  };
}

export function useParkingRecords() {
  const [records, setRecords] = useState<ParkingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("parking_records")
      .select("*")
      .order("entry_time", { ascending: false });
    if (error) {
      console.error("Error fetching records:", error);
      setLoading(false);
      return;
    }
    setRecords((data as RawRecord[]).map(toAppRecord));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Proper type for insert!
  const addEntry = async (
    record: Omit<ParkingRecord, "id" | "status"> & { status?: ParkingRecord["status"] }
  ) => {
    // Construct an object with all required fields for insert
    const toInsert = toRawInsert(record);

    // required fields check
    if (
      !toInsert.vehicle_number ||
      !toInsert.vehicle_type ||
      !toInsert.entry_time ||
      !toInsert.status
    ) {
      throw new Error("Missing required fields for parking record insert");
    }
    // calculation_breakdown is optional (should be JSON array if present)
    if (toInsert.calculation_breakdown && !Array.isArray(toInsert.calculation_breakdown)) {
      toInsert.calculation_breakdown = [String(toInsert.calculation_breakdown)];
    }

    const { data, error } = await supabase
      .from("parking_records")
      .insert([toInsert]) // Pass as array for insert
      .select()
      .single();

    if (error) {
      throw error;
    }

    const saved = toAppRecord(data as RawRecord);
    setRecords((prev) => [saved, ...prev]);
    return saved;
  };

  const updateExit = async (id: string, update: Partial<ParkingRecord>) => {
    const { data, error } = await supabase
      .from("parking_records")
      .update(fromAppRecord(update))
      .eq("id", Number(id))
      .select()
      .single();

    if (error) {
      throw error;
    }

    const updated = toAppRecord(data as RawRecord);
    setRecords((prev) =>
      prev.map((r) => (r.id === String(updated.id) ? updated : r))
    );
    return updated;
  };

  return {
    records,
    loading,
    addEntry,
    updateExit,
    fetchRecords,
    setRecords,
  };
}
