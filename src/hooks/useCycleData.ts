import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { CycleRecord, DayLog, FlowLevel } from '../lib/types';
import { STORAGE_KEYS } from '../lib/storage';
import { getCycleStats } from '../lib/cycleCalculator';
import { datesInRange, todayISO } from '../lib/dates';
import { markDay as markDayIn, uid } from '../lib/period';

export type DayPatch = Partial<Omit<DayLog, 'id' | 'date'>>;

export function useCycleData() {
  const [cycles, setCycles] = useLocalStorage<CycleRecord[]>(STORAGE_KEYS.CYCLE_RECORDS, []);
  const [dayLogs, setDayLogs] = useLocalStorage<DayLog[]>(STORAGE_KEYS.DAY_LOGS, []);

  const stats = useMemo(() => getCycleStats(cycles), [cycles]);

  const startPeriod = useCallback((date: string = todayISO()) => {
    setCycles((prev) =>
      prev.some((c) => !c.endDate) ? prev : [...prev, { id: uid(), startDate: date, flowByDay: {} }]
    );
  }, [setCycles]);

  const endPeriod = useCallback((date: string) => {
    setCycles((prev) => prev.map((c) => (!c.endDate ? { ...c, endDate: date < c.startDate ? c.startDate : date } : c)));
  }, [setCycles]);

  const addPastCycle = useCallback((startDate: string, endDate: string, flow: FlowLevel) => {
    const flowByDay: Record<string, FlowLevel> = {};
    datesInRange(startDate, endDate).forEach((d) => { flowByDay[d] = flow; });
    setCycles((prev) => [...prev, { id: uid(), startDate, endDate, flowByDay }]);
  }, [setCycles]);

  const markDay = useCallback((date: string, flow: FlowLevel | null) => {
    setCycles((prev) => markDayIn(prev, date, flow, todayISO()));
  }, [setCycles]);

  const deleteCycle = useCallback((id: string) => {
    setCycles((prev) => prev.filter((c) => c.id !== id));
  }, [setCycles]);

  const updateDay = useCallback((date: string, patch: DayPatch) => {
    setDayLogs((prev) => {
      const existing = prev.find((l) => l.date === date);
      const base: DayLog = existing ?? { id: uid(), date, symptoms: [] };
      const values = patch.values ? { ...base.values, ...patch.values } : base.values;
      if (values) {
        for (const k of Object.keys(values)) if (values[k] === undefined) delete values[k];
      }
      const merged: DayLog = { ...base, ...patch, values };
      return existing ? prev.map((l) => (l.date === date ? merged : l)) : [...prev, merged];
    });
  }, [setDayLogs]);

  const getDayLog = useCallback((date: string) => dayLogs.find((l) => l.date === date), [dayLogs]);

  return {
    cycles,
    setCycles,
    dayLogs,
    stats,
    startPeriod,
    endPeriod,
    addPastCycle,
    markDay,
    deleteCycle,
    updateDay,
    getDayLog,
  };
}
