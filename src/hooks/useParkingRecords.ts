
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

// For insert: all required keys must be given!
function fromAppRecordInsert(record: Omit<ParkingRecord, "id">): Omit<RawRecord, "id"> {
  return {
    vehicle_number: record.vehicleNumber,
    vehicle_type: record.vehicleType,
    entry_time: record.entryTime.toISOString(), // must be present
    exit_time: record.exitTime ? record.exitTime.toISOString() : null,
    duration: record.duration ?? null,
    amount_due: record.amountDue ?? null,
    status: record.status,
    is_pass_holder: record.isPassHolder ?? null,
    pass_id: record.passId ?? null,
    calculation_breakdown: record.calculationBreakdown ?? null,
    helmet: record.helmet ?? null,
    created_at: null, // let db default
  };
}

// For update: allow partials (all fields optional)
function fromAppRecordUpdate(record: Partial<ParkingRecord>): Partial<RawRecord> {
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
    calculation_breakdown: record.calculationBreakdown,
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

  // Fix: Strong type, so all required fields are present
  const addEntry = async (
    record: Omit<ParkingRecord, "id" | "status"> & { status?: ParkingRecord["status"] }
  ) => {
    // status must be present (default to 'active' if not)
    const fullRecord: Omit<ParkingRecord, "id"> = {
      vehicleNumber: record.vehicleNumber,
      vehicleType: record.vehicleType,
      entryTime: record.entryTime,
      exitTime: record.exitTime,
      duration: record.duration,
      amountDue: record.amountDue,
      status: record.status ?? "active",
      isPassHolder: record.isPassHolder,
      passId: record.passId,
      calculationBreakdown: record.calculationBreakdown,
      helmet: record.helmet,
    };
    const toInsert = fromAppRecordInsert(fullRecord);

    // required fields check (extra runtime guard)
    if (
      !toInsert.vehicle_number ||
      !toInsert.vehicle_type ||
      !toInsert.entry_time ||
      !toInsert.status
    ) {
      throw new Error("Missing required fields for parking record insert");
    }

    // calculation_breakdown should be JSON (null if not present)
    if (
      toInsert.calculation_breakdown &&
      !Array.isArray(toInsert.calculation_breakdown)
    ) {
      toInsert.calculation_breakdown = [String(toInsert.calculation_breakdown)];
    }

    const { data, error } = await supabase
      .from("parking_records")
      .insert([toInsert])
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
      .update(fromAppRecordUpdate(update))
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
