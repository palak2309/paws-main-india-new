import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLiveNotifications, type LiveNotificationItem } from "@/lib/notifications.functions";
import { useMockAuth } from "@/providers/mock-auth-provider";

const STORAGE_KEY = "autoaudit_read_notifications_v1";

export interface NotificationWithStatus extends LiveNotificationItem {
  read: boolean;
  timeFormatted: string;
}

function formatRelativeTime(dateString: string): string {
  try {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString();
  } catch {
    return "Recent";
  }
}

export function useNotifications() {
  const { session } = useMockAuth();
  const fetchFn = useServerFn(getLiveNotifications);
  const queryClient = useQueryClient();

  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  const query = useQuery({
    queryKey: ["live-notifications", session?.user.id ?? "anonymous"],
    queryFn: () => fetchFn(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // ignore storage quota errors
      }
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    const all = query.data?.notifications ?? [];
    const next = new Set(all.map((n) => n.id));
    setReadIds(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
    } catch {
      // ignore
    }
  }, [query.data?.notifications]);

  const toggleRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const notifications: NotificationWithStatus[] = useMemo(() => {
    const rawList = query.data?.notifications ?? [];
    return rawList.map((item) => ({
      ...item,
      read: readIds.has(item.id),
      timeFormatted: formatRelativeTime(item.timestamp),
    }));
  }, [query.data?.notifications, readIds]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
    markAsRead,
    markAllAsRead,
    toggleRead,
  };
}
