import { useEffect, useState, useCallback } from 'react';
import { getShareLinks } from '../api/sharingApi';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';

export function useNotificationPoll(pollIntervalMs = 60000) {
  const token = useAuthStore((s) => s.token);
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const [totalUnseen, setTotalUnseen] = useState(0);

  const fetchUnseenCount = useCallback(async () => {
    if (!token || !activeProfile?.id) {
      setTotalUnseen(0);
      return;
    }

    try {
      const data = await getShareLinks(activeProfile.id);
      const links = data.share_links || [];
      const sum = links.reduce((acc, link) => acc + (link.unseen_count || 0), 0);
      setTotalUnseen(sum);
    } catch {
      // Quiet fallback for polling errors
    }
  }, [token, activeProfile?.id]);

  useEffect(() => {
    fetchUnseenCount();

    if (pollIntervalMs && token && activeProfile?.id) {
      const timer = setInterval(fetchUnseenCount, pollIntervalMs);
      return () => clearInterval(timer);
    }
  }, [fetchUnseenCount, pollIntervalMs, token, activeProfile?.id]);

  return {
    totalUnseen,
    refetch: fetchUnseenCount,
  };
}
