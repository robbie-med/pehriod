import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '../lib/storage';
import { Answer, Answers } from '../lib/visit';

export function useVisit() {
  const [answers, setAnswers] = useLocalStorage<Answers>(STORAGE_KEYS.VISIT, {});

  const setAnswer = useCallback((id: string, value: Answer | undefined) => {
    setAnswers((prev) => {
      const next = { ...prev };
      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) delete next[id];
      else next[id] = value;
      return next;
    });
  }, [setAnswers]);

  const clearAnswers = useCallback(() => setAnswers({}), [setAnswers]);

  return { answers, setAnswer, clearAnswers };
}
