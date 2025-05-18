import { useEffect, useState, useCallback } from "react";
import { SharableItem } from "@/api/models/SharableItem";
import { getInvitesForItem } from "@/api/db_ops";

export function useFetchInvitedUsers(item: SharableItem) {
  const [invites, setInvites] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const res = await getInvitesForItem(item);
      setInvites(res.data);
    })();

    setLoading(false);
    
    console.log("Getting invites")
    console.log(invites)

  }, [item, refreshIndex]);

  return { invites, loading, handleRefresh };
}
