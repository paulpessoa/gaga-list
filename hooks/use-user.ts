import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export const USER_QUERY_KEY = ['user'];

export function useUser() {
  return useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        throw new Error(error.message);
      }
      return user;
    },
  });
}
