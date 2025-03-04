-- Create RPC function to safely increment message count
CREATE OR REPLACE FUNCTION increment_message_count(user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_message_counts (user_id, free_messages_used)
  VALUES (user_id, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    free_messages_used = user_message_counts.free_messages_used + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION increment_message_count TO authenticated; 