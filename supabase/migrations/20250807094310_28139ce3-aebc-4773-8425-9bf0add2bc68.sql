-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for updating timestamps on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating timestamps on search_history
CREATE TRIGGER update_search_history_updated_at
  BEFORE UPDATE ON public.search_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();