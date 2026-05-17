"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/src/store/auth.store";
import {
  NOTIFICATION_CHANGED_EVENT,
  getMyNotifications,
} from "@/src/services/notification.service";
import type {
  CustomerNotification,
  NotificationsResult,
} from "@/src/types/notification.types";

const POLL_INTERVAL_MS = 60_000;
const PREVIEW_LIMIT = 10;
const LOAD_MORE_STEP = 10;

interface UseNotificationsState {
  items: CustomerNotification[];
  unreadCount: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => void;
  resetPreview: () => void;
}

/**
 * Reads the latest notifications for the authenticated customer.
 * Polls every 60s, refetches on window focus, and listens to the
 * `notification:changed` event dispatched by the service after mark-read calls.
 */
export function useNotifications(): UseNotificationsState {
  const { state: authState } = useAuth();
  const [items, setItems] = useState<CustomerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(PREVIEW_LIMIT);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const refetch = useCallback(async () => {
    if (!authState.user) {
      setItems([]);
      setUnreadCount(0);
      setTotal(0);
      return;
    }
    const isInitial = items.length === 0;
    if (isInitial) setLoading(true);
    try {
      const result: NotificationsResult = await getMyNotifications({
        page: 1,
        limit: pageSize,
      });
      setItems(result.items);
      setUnreadCount(result.unreadCount);
      setTotal(result.total);
    } catch {
      // Keep previous values on transient errors.
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [authState.user, pageSize, items.length]);

  const loadMore = useCallback(() => {
    if (loadingMore || loading) return;
    setLoadingMore(true);
    setPageSize((s) => s + LOAD_MORE_STEP);
  }, [loadingMore, loading]);

  const resetPreview = useCallback(() => {
    setPageSize(PREVIEW_LIMIT);
  }, []);

  // Initial + on auth change
  useEffect(() => {
    if (!authState.hydrated) return;
    refetch();
  }, [authState.hydrated, authState.user, refetch]);

  // Polling
  useEffect(() => {
    if (!authState.user) return;
    const id = window.setInterval(refetch, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [authState.user, refetch]);

  // Refetch on focus / visibility regain
  useEffect(() => {
    if (!authState.user) return;
    const onFocus = () => refetch();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refetch();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [authState.user, refetch]);

  // Refresh after any mutation (markRead, markAllRead)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => refetch();
    window.addEventListener(NOTIFICATION_CHANGED_EVENT, handler);
    return () => window.removeEventListener(NOTIFICATION_CHANGED_EVENT, handler);
  }, [refetch]);

  const hasMore = items.length < total;

  return {
    items,
    unreadCount,
    total,
    hasMore,
    loading,
    loadingMore,
    refetch,
    loadMore,
    resetPreview,
  };
}
