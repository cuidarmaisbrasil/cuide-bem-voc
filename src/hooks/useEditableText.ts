import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useEditableText(key: string, fallback = "") {
  const [text, setText] = useState(fallback);
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("wellness_editable_texts")
      .select("content")
      .eq("key", key)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.content) setText(data.content);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);
  return text;
}
