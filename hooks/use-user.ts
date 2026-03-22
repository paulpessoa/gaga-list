import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';

export const USER_QUERY_KEY = ['user'];
export const PROFILE_QUERY_KEY = ['profile'];

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

export function useProfile() {
  const { data: user } = useUser();
  
  return useQuery({
    queryKey: [...PROFILE_QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user?.id,
  });
}
