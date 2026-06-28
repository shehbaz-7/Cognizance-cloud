"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useRef } from "react";
import { auth } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatContextType {
  getChat: (skillId: string, type: string) => ChatMessage[];
  saveChat: (skillId: string, type: string, messages: ChatMessage[]) => Promise<void>;
  loading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [user, authLoading] = useAuthState(auth);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
  const [loading, setLoading] = useState(true);

  // Initial load of all chats for the user
  useEffect(() => {
    if (authLoading) return;

    const loadChats = async () => {
      if (!user) {
        setChats({});
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/db/chats?userId=${user.uid}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to load chats');
        }
        const data = await res.json();

        const chatMap: Record<string, ChatMessage[]> = {};
        data?.forEach((chat: any) => {
          const key = `${chat.skill_id || 'global'}_${chat.type}`;
          chatMap[key] = chat.messages;
        });
        setChats(chatMap);
      } catch (err) {
        console.warn("Failed to load chats from cloud", err);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [user, authLoading]);

  const getChat = useCallback((skillId: string, type: string) => {
    const key = `${skillId || 'global'}_${type}`;
    return chats[key] || [];
  }, [chats]);

  const saveChat = useCallback(async (skillId: string, type: string, messages: ChatMessage[]) => {
    const key = `${skillId || 'global'}_${type}`;
    setChats(prev => ({ ...prev, [key]: messages }));

    if (user) {
      try {
        await fetch('/api/db/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.uid,
            skill_id: skillId || null,
            type,
            messages
          })
        });
      } catch (err) {
        console.error("Failed to sync chat to cloud", err);
      }
    }
  }, [user]);

  return (
    <ChatContext.Provider value={{ getChat, saveChat, loading }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
