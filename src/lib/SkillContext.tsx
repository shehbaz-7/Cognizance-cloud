"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useRef } from "react";
import type { Skill, QuizAttempt, SavedRevision } from "./types";
import { RetentionEngine } from "./retention-engine";
import { auth } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";

// ─── Context Type ─────────────────────────────────────────────────────────────

interface SkillContextType {
  skills: Skill[];
  isSyncing: boolean;
  loading: boolean;
  addSkill: (data: Omit<Skill, "id" | "retentionScore" | "decayRisk" | "status" | "nextReviewDate" | "forecast24h" | "forecast7d" | "quizHistory" | "savedRevisions" | "weakTopics" | "subskills" | "revisionCount" | "createdAt">) => void;
  removeSkill: (id: string) => void;
  updateSkill: (id: string, updates: Partial<Skill>) => void;
  getSkill: (id: string) => Skill | undefined;
  addQuizResult: (skillId: string, attempts: QuizAttempt[]) => void;
  saveRevision: (skillId: string, revisionPayload: Omit<SavedRevision, "id" | "createdAt">) => void;
  removeRevision: (skillId: string, revisionId: string) => void;
  markPracticed: (id: string) => void;
  graduateSkill: (id: string) => void;
}

const SkillContext = createContext<SkillContextType | undefined>(undefined);

// ─── Storage Key (per user) ───────────────────────────────────────────────────

function getStorageKey(uid: string | undefined) {
  return uid ? `cognizance_skills_v3_${uid}` : "cognizance_skills_v3_guest";
}

// ─── Load skills from localStorage (as fallback) ──────────────────────────────

function loadLocalSkills(uid: string | undefined): Skill[] {
  try {
    const stored = localStorage.getItem(getStorageKey(uid));
    if (!stored) return [];
    const parsed: Skill[] = JSON.parse(stored);
    return parsed.map(skill => {
      const stableSkill = {
        ...skill,
        subskills: skill.subskills || [],
        prerequisites: skill.prerequisites || [],
        missingPrerequisites: skill.missingPrerequisites || [],
        savedRevisions: skill.savedRevisions || [],
      };
      const { score, risk, status, nextReviewDate, forecast24h, forecast7d } = RetentionEngine.compute(stableSkill);
      return { ...stableSkill, retentionScore: score, decayRisk: risk, status, nextReviewDate, forecast24h, forecast7d };
    });
  } catch {
    return [];
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SkillProvider({ children }: { children: ReactNode }) {
  const [user, authLoading] = useAuthState(auth);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Load & Cloud Sync Trigger
  useEffect(() => {
    if (authLoading) return;

    const initData = async () => {
      const uid = user?.uid;
      const local = loadLocalSkills(uid);
      
      if (uid) {
        setIsSyncing(true);
        try {
          const res = await fetch(`/api/db/skills?userId=${uid}`);
          const data = await res.json();

          if (data?.error && data.error !== 'PGRST116') {
             console.error("Cloud fetch error:", data.error);
          } else if (data?.skills) {
             // Cloud data exists, it takes priority
             setSkills(data.skills);
          } else if (local.length > 0) {
             // No cloud data but local data exists, sync it up
             await fetch('/api/db/skills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: uid, skills: local }) });
             setSkills(local);
          } else {
             setSkills([]);
          }
        } catch (e) {
          console.error("Sync failed, falling back to local", e);
          setSkills(local);
        } finally {
          setIsSyncing(false);
        }
      } else {
        setSkills(local);
      }
      setHydrated(true);
    };

    initData();
  }, [user, authLoading]);

  // 2. Persist Changes (Local + Debounced Cloud)
  useEffect(() => {
    if (!hydrated) return;

    const uid = user?.uid;
    localStorage.setItem(getStorageKey(uid), JSON.stringify(skills));

    if (uid) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(async () => {
        try {
          await fetch('/api/db/skills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: uid, skills: skills }) });
        } catch (e) {
          console.warn("Background cloud sync failed", e);
        }
      }, 2000);
    }
  }, [skills, user, hydrated]);

  const addSkill = useCallback((data: any) => {
    const newSkill: Skill = {
      ...data,
      id: `skill_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      retentionScore: 100,
      decayRisk: 0,
      status: "healthy",
      nextReviewDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      forecast24h: 100,
      forecast7d: 100,
      quizHistory: [],
      savedRevisions: [],
      weakTopics: [],
      subskills: [],
      revisionCount: 0,
      createdAt: new Date().toISOString(),
    };
    const { score, risk, status, nextReviewDate, forecast24h, forecast7d } = RetentionEngine.compute(newSkill);
    setSkills(prev => [...prev, { ...newSkill, retentionScore: score, decayRisk: risk, status, nextReviewDate, forecast24h, forecast7d }]);
  }, []);

  const removeSkill = useCallback((id: string) => {
    setSkills(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateSkill = useCallback((id: string, updates: Partial<Skill>) => {
    setSkills(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, ...updates };
      const { score, risk, status, nextReviewDate, forecast24h, forecast7d } = RetentionEngine.compute(updated);
      return { ...updated, retentionScore: score, decayRisk: risk, status, nextReviewDate, forecast24h, forecast7d };
    }));
  }, []);

  const getSkill = useCallback((id: string) => {
    return skills.find(s => s.id === id);
  }, [skills]);

  const addQuizResult = useCallback((skillId: string, attempts: QuizAttempt[]) => {
    setSkills(prev => prev.map(s => {
      if (s.id !== skillId) return s;
      const newHistory = [...s.quizHistory, ...attempts];
      const accuracy = Math.round((attempts.filter(a => a.correct).length / attempts.length) * 100);
      const quizUpdates = RetentionEngine.updateAfterQuiz(s, accuracy);
      const weakTopics = RetentionEngine.getWeakTopics({ ...s, quizHistory: newHistory }).map(w => w.name);
      
      const newSubskills = [...s.subskills];
      for (const attempt of attempts) {
        if (!attempt.subskill) continue;
        let sub = newSubskills.find(x => x.name === attempt.subskill);
        if (!sub) {
          sub = { name: attempt.subskill, strength: 50, lastTested: new Date().toISOString() };
          newSubskills.push(sub);
        }
        sub.lastTested = new Date().toISOString();
        if (attempt.correct) { sub.strength = Math.min(100, sub.strength + 15); }
        else { sub.strength = Math.max(0, sub.strength - 25); }
      }
      
      const updated = { ...s, ...quizUpdates, quizHistory: newHistory, weakTopics, subskills: newSubskills };
      const { score, risk, status, nextReviewDate, forecast24h, forecast7d } = RetentionEngine.compute(updated);
      return { ...updated, retentionScore: score, decayRisk: risk, status, nextReviewDate, forecast24h, forecast7d };
    }));
  }, []);

  const saveRevision = useCallback((skillId: string, payload: Omit<SavedRevision, "id" | "createdAt">) => {
    setSkills(prev => prev.map(s => {
      if (s.id !== skillId) return s;
      const newRev: SavedRevision = {
        ...payload,
        id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString()
      };
      return { ...s, savedRevisions: [newRev, ...(s.savedRevisions || [])] };
    }));
  }, []);

  const removeRevision = useCallback((skillId: string, revisionId: string) => {
    setSkills(prev => prev.map(s => {
      if (s.id !== skillId) return s;
      return { ...s, savedRevisions: (s.savedRevisions || []).filter(r => r.id !== revisionId) };
    }));
  }, []);

  const markPracticed = useCallback((id: string) => {
    updateSkill(id, {
      lastPracticed: new Date().toISOString(),
      revisionCount: (skills.find(s => s.id === id)?.revisionCount ?? 0) + 1,
    });
  }, [updateSkill, skills]);

  const graduateSkill = useCallback((skillId: string) => {
    const levels: Skill['proficiency'][] = ["Beginner", "Intermediate", "Advanced", "Master"];
    setSkills(prev => prev.map(skill => {
      if (skill.id !== skillId) return skill;
      const currentIdx = levels.indexOf(skill.proficiency || "Beginner");
      if (currentIdx < levels.length - 1) {
        return {
          ...skill,
          proficiency: levels[currentIdx + 1],
          lastPracticed: new Date().toISOString()
        };
      }
      return skill;
    }));
  }, []);

  const loading = authLoading || !hydrated;

  return (
    <SkillContext.Provider value={{ 
      skills, 
      isSyncing, 
      loading,
      addSkill, 
      removeSkill, 
      updateSkill, 
      getSkill, 
      addQuizResult, 
      saveRevision, 
      removeRevision,
      markPracticed,
      graduateSkill
    }}>
      {children}
    </SkillContext.Provider>
  );
}

export function useSkills() {
  const ctx = useContext(SkillContext);
  if (!ctx) throw new Error("useSkills must be used within SkillProvider");
  return ctx;
}
