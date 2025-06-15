import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MonthlyPass } from "@/types/parking";

// Supabase representation of a monthly pass
type RawPass = {
  id: string;
  vehicle_number: string;
  pass_type: string;
  vehicle_type: string;
  owner_name: string;
  owner_phone: string;
  start_date: string;
  end_date: string;
  amount: number;
  status: string;
  last_used_at: string | null;
  created_at: string | null;
};

function toAppPass(raw: RawPass): MonthlyPass {
  return {
    id: raw.id,
    vehicleNumber: raw.vehicle_number,
    passType: raw.pass_type as MonthlyPass["passType"],
    vehicleType: raw.vehicle_type as MonthlyPass["vehicleType"],
    ownerName: raw.owner_name,
    ownerPhone: raw.owner_phone,
    startDate: new Date(raw.start_date),
    endDate: new Date(raw.end_date),
    amount: Number(raw.amount),
    status: raw.status as MonthlyPass["status"],
    lastUsedAt: raw.last_used_at ? new Date(raw.last_used_at) : undefined,
    createdAt: raw.created_at ? new Date(raw.created_at) : undefined,
  };
}

function fromAppPass(record: Omit<MonthlyPass, "id"> | Partial<MonthlyPass>): RawPass | Partial<RawPass> {
  // If all properties needed for insert, return non-partial
  // Else for update, partial is okay
  // Used for insert when creating: Omit<MonthlyPass, "id">
  // Used for update when updating: Partial<MonthlyPass>
  if (
    "vehicleNumber" in record &&
    "passType" in record &&
    "vehicleType" in record &&
    "ownerName" in record &&
    "ownerPhone" in record &&
    "startDate" in record &&
    "endDate" in record &&
    "amount" in record &&
    "status" in record
  ) {
    const _r = record as Omit<MonthlyPass, "id">;
    return {
      vehicle_number: _r.vehicleNumber,
      pass_type: _r.passType,
      vehicle_type: _r.vehicleType,
      owner_name: _r.ownerName,
      owner_phone: _r.ownerPhone,
      start_date: _r.startDate.toISOString(),
      end_date: _r.endDate.toISOString(),
      amount: _r.amount,
      status: _r.status,
      last_used_at: _r.lastUsedAt ? _r.lastUsedAt.toISOString() : null,
      // id, created_at handled by db
    };
  }
  // Partial (update)
  return {
    vehicle_number: record.vehicleNumber,
    pass_type: record.passType,
    vehicle_type: record.vehicleType,
    owner_name: record.ownerName,
    owner_phone: record.ownerPhone,
    start_date: record.startDate ? record.startDate.toISOString() : undefined,
    end_date: record.endDate ? record.endDate.toISOString() : undefined,
    amount: record.amount,
    status: record.status,
    last_used_at: record.lastUsedAt ? record.lastUsedAt.toISOString() : undefined,
    // created_at handled by db
  };
}

export function useMonthlyPasses() {
  const [passes, setPasses] = useState<MonthlyPass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPasses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("monthly_passes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching passes:", error);
      setLoading(false);
      return;
    }
    setPasses((data as RawPass[]).map(toAppPass));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPasses();
  }, [fetchPasses]);

  // This fixes the .insert type: always pass all required fields (insert expects RawPass, not Partial)
  const addPass = async (record: Omit<MonthlyPass, "id">) => {
    const toInsert = fromAppPass(record) as RawPass;
    const { data, error } = await supabase
      .from("monthly_passes")
      .insert([toInsert])
      .select()
      .single();
    if (error) {
      throw error;
    }
    const saved = toAppPass(data as RawPass);
    setPasses((prev) => [saved, ...prev]);
    return saved;
  };

  const updatePass = async (id: string, update: Partial<MonthlyPass>) => {
    const { data, error } = await supabase
      .from("monthly_passes")
      .update(fromAppPass(update))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    const updated = toAppPass(data as RawPass);
    setPasses((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    return updated;
  };

  return {
    passes,
    loading,
    addPass,
    updatePass,
    fetchPasses,
    setPasses,
  };
}
