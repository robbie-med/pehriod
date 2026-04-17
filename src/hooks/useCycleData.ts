import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { CycleRecord, DayLog, FlowLevel } from '../lib/types';
import { STORAGE_KEYS } from '../lib/storage';
import { getCycleStats, todayISO, getDatesInRange } from '../lib/cycleCalculator';

export function useCycleData() {
  const [cycles, setCycles] = useLocalStorage<CycleRecord[]>(
    STORAGE_KEYS.CYCLE_RECORDS,
    []
  );

  const [dayLogs, setDayLogs] = useLocalStorage<DayLog[]>(
    STORAGE_KEYS.DAY_LOGS,
    []
  );

  const stats = useMemo(() => getCycleStats(cycles), [cycles]);

  const startPeriod = useCallback(() => {
    const today = todayISO();
    if (cycles.some((c) => !c.endDate)) return;
    const newCycle: CycleRecord = {
      id: crypto.randomUUID(),
      startDate: today,
      flowByDay: { [today]: 'medium' },
    };
    setCycles((prev) => [...prev, newCycle]);
  }, [cycles, setCycles]);

  const endPeriod = useCallback(() => {
    const today = todayISO();
    setCycles((prev) =>
      prev.map((c) => (!c.endDate ? { ...c, endDate: today } : c))
    );
  }, [setCycles]);

  const addPastCycle = useCallback(
    (startDate: string, endDate: string, defaultFlow: FlowLevel) => {
      const flowByDay: Record<string, FlowLevel> = {};
      getDatesInRange(startDate, endDate).forEach((d) => {
        flowByDay[d] = defaultFlow;
      });
      const newCycle: CycleRecord = {
        id: crypto.randomUUID(),
        startDate,
        endDate,
        flowByDay,
      };
      setCycles((prev) => [...prev, newCycle]);
    },
    [setCycles]
  );

  const logFlow = useCallback(
    (date: string, flow: FlowLevel) => {
      setCycles((prev) => {
        const idx = prev.findIndex((c) => {
          const end = c.endDate ?? todayISO();
          return c.startDate <= date && date <= end;
        });
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          flowByDay: { ...updated[idx].flowByDay, [date]: flow },
        };
        return updated;
      });
    },
    [setCycles]
  );

  const deleteCycle = useCallback(
    (id: string) => {
      setCycles((prev) => prev.filter((c) => c.id !== id));
    },
    [setCycles]
  );

  const saveDayLog = useCallback(
    (log: Omit<DayLog, 'id'>) => {
      setDayLogs((prev) => {
        const filtered = prev.filter((l) => l.date !== log.date);
        return [...filtered, { ...log, id: crypto.randomUUID() }];
      });
    },
    [setDayLogs]
  );

  const getDayLog = useCallback(
    (date: string): DayLog | undefined => {
      return dayLogs.find((l) => l.date === date);
    },
    [dayLogs]
  );

  return {
    cycles,
    dayLogs,
    stats,
    startPeriod,
    endPeriod,
    addPastCycle,
    logFlow,
    deleteCycle,
    saveDayLog,
    getDayLog,
  };
}
