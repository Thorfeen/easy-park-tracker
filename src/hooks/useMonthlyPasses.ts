
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
  };
}

function fromAppPass(record: Partial<MonthlyPass>): Partial<RawPass> {
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

  const addPass = async (record: Omit<MonthlyPass, "id">) => {
    const toInsert = {
      ...fromAppPass(record)
    };
    if (
      !toInsert.vehicle_number ||
      !toInsert.pass_type ||
      !toInsert.vehicle_type ||
      !toInsert.owner_name ||
      !toInsert.owner_phone ||
      !toInsert.start_date ||
      !toInsert.end_date ||
      !toInsert.amount ||
      !toInsert.status
    ) {
      throw new Error("Missing required fields for monthly pass insert");
    }
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
