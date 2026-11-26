-- MODEL DISPLAY NAMES (November 26, 2026). model_registry.display_name is the clean, human name the
-- Terminal shows; model_name stays the matching key the vendor heads read and write, untouched.
-- propose_display_name() turns a raw registry name into a display name by rule:
--   drops platform and organisation path prefixes (fal-ai/, @cf/, openai/, black-forest-labs/ ...),
--   splits on - _ /, restores maker casing (GPT, DeepSeek, Qwen, FLUX, MiniMax ...), upper-cases sizes
--   and acronyms (8B, A35B, TTS, VL, LoRA ...), rejoins split versions (3-5 -> 3.5), and moves snapshot
--   dates to the end in parentheses. Names that already read as human names are kept as they are.
-- Aliases carry their anchor's display name. Hand corrections are written straight to display_name.
create or replace function public.propose_display_name(p_name text, p_creator text default null)
returns text language plpgsql immutable set search_path = public as $$
declare
  s text := btrim(coalesce(p_name, ''));
  suf text := ''; dt text := ''; segs text[]; seg text; toks text[]; t text; lt text; o text[] := '{}'; prev text; i int; res text;
  orgs text[] := array['openai','google','deepseek-ai','deepseek','nvidia','qwen','meta','meta-llama','black-forest-labs','prunaai','topazlabs','topaz',
    'minimax','lightricks','bria','decart','uthana','ricursiveai','radixark','huggingface','elevenlabs','mistralai','microsoft','moonshotai','zai-org',
    'thudm','baai','intfloat','sentence-transformers','stabilityai','stability-ai','bytedance','tencent','alibaba','alibaba-cloud','amazon','cohere',
    'ibm-granite','ibm','xai','anthropic','perplexity','01-ai','allenai','nousresearch','sao10k','thedrummer','gryphe','arcee-ai','liquid','inclusionai',
    'xiaomimimo','baidu','stepfun-ai','minimaxai','zhipuai','swiss-ai','lgai-exaone','upstage','writer','ai21labs','cartesia','canopylabs','hexgrad',
    'resemble-ai','sesame','fishaudio','fish-audio','meituan-longcat','skywork','openbmb','opengvlab','llava-hf','idea-research','luma','lumaai','runway','runwayml','rundiffusion-fal','mistral','kwaivgi','bytedance-seed'];
  orgnm jsonb := '{"topazlabs":"Topaz","topaz":"Topaz","prunaai":"Pruna","ricursiveai":"Ricursive","radixark":"RadixArk","rundiffusion-fal":"RunDiffusion",
    "elevenlabs":"ElevenLabs","bria":"Bria","decart":"Decart","uthana":"Uthana","inclusionai":"inclusionAI","black-forest-labs":"Black Forest Labs",
    "stabilityai":"Stability AI","stability-ai":"Stability AI","bytedance":"ByteDance","minimaxai":"MiniMax","meituan-longcat":"Meituan","idea-research":"IDEA Research","mistralai":"Mistral","nvidia":"NVIDIA","zai-org":"Z.ai","kwaivgi":"Kuaishou","bytedance-seed":"ByteDance"}';
  o0 text; n0 text;
  brands jsonb := '{"qwen":"Qwen","qwq":"QwQ","qvq":"QVQ","deepseek":"DeepSeek","llama":"Llama","gemma":"Gemma","gemini":"Gemini","claude":"Claude",
    "grok":"Grok","kimi":"Kimi","minimax":"MiniMax","mistral":"Mistral","ministral":"Ministral","mixtral":"Mixtral","devstral":"Devstral",
    "codestral":"Codestral","pixtral":"Pixtral","magistral":"Magistral","phi":"Phi","flux":"FLUX","kling":"Kling","wan":"Wan","hunyuan":"Hunyuan",
    "ltx":"LTX","seedream":"Seedream","seedance":"Seedance","seed":"Seed","sora":"Sora","veo":"Veo","imagen":"Imagen","whisper":"Whisper",
    "elevenlabs":"ElevenLabs","voyage":"Voyage","cohere":"Cohere","command":"Command","jamba":"Jamba","nova":"Nova","titan":"Titan",
    "nemotron":"Nemotron","cosyvoice":"CosyVoice","glm":"GLM","gpt":"GPT","ernie":"ERNIE","hidream":"HiDream","ideogram":"Ideogram",
    "recraft":"Recraft","pixverse":"PixVerse","vidu":"Vidu","hailuo":"Hailuo","bge":"BGE","e5":"E5","gte":"GTE","bert":"BERT",
    "distilbert":"DistilBERT","sdxl":"SDXL","sd":"SD","lora":"LoRA","controlnet":"ControlNet","tts":"TTS","stt":"STT","asr":"ASR","ocr":"OCR",
    "vl":"VL","mt":"MT","ai":"AI","hd":"HD","sdr":"SDR","hdr":"HDR","3d":"3D","2d":"2D","xl":"XL","xxl":"XXL","api":"API","it":"IT",
    "awq":"AWQ","gptq":"GPTQ","gguf":"GGUF","fp8":"FP8","fp16":"FP16","bf16":"BF16","int8":"INT8","int4":"INT4","i2v":"I2V","t2v":"T2V",
    "t2i":"T2I","i2i":"I2I","v2v":"V2V","a2v":"A2V","rag":"RAG","moe":"MoE","sst":"SST","lcm":"LCM","sam":"SAM","evf":"EVF","rmbg":"RMBG",
    "esrgan":"ESRGAN","oss":"OSS","mai":"MAI","exaone":"EXAONE","longcat":"LongCat","mimo":"MiMo","step":"Step","stepaudio":"StepAudio",
    "granite":"Granite","olmo":"OLMo","sonar":"Sonar","sonic":"Sonic","aion":"Aion","rodin":"Rodin","moondream":"Moondream","pika":"Pika",
    "luma":"Luma","ray":"Ray","photon":"Photon","bria":"Bria","topaz":"Topaz","tripo":"Tripo","meshy":"Meshy","krea":"Krea","reve":"Reve",
    "wai":"WAI","cogvideox":"CogVideoX","cogview":"CogView","skyreels":"SkyReels","hunyuan3d":"Hunyuan3D","hy":"Hy","vibevoice":"VibeVoice",
    "lipsync":"Lipsync","faceswap":"Face Swap","rerank":"Rerank","embed":"Embed","embedding":"Embedding","realtime":"Realtime","and":"and",
    "of":"of","to":"to","with":"with","for":"for","in":"in","on":"on","by":"by","dall":"DALL","e2ee":"E2EE","hyper3d":"Hyper3D","ling":"Ling","ring":"Ring","srpo":"SRPO","livetranslate":"LiveTranslate","er":"ER","voxtral":"Voxtral","autoglm":"AutoGLM","cpu":"CPU","gpu":"GPU","cosmos":"Cosmos"}';
  hy text[] := array['GPT','GLM','Phi','DeepSeek','DALL','MAI'];
  mon text[] := array['January','February','March','April','May','June','July','August','September','October','November','December'];
begin
  if s = '' then return p_name; end if;
  -- an existing parenthetical stays as it is, at the end
  if s ~ '\s\(.*\)$' then suf := substring(s from '(\s\(.*\))$'); s := btrim(regexp_replace(s, '\s\(.*\)$', '')); end if;
  -- already a human name: capitalised, no path or underscore, no hyphenated lower-case words
  if s !~ '[/_@]' and s ~ '^[A-Z0-9]' and (s !~ '-[a-z]{2,}' or s ~ '\s') then return s || suf; end if;
  segs := string_to_array(s, '/');
  if array_length(segs, 1) > 1 and lower(segs[1]) in ('@cf', 'fal-ai', 'fal') then segs := segs[2:]; end if;
  -- an organisation segment goes; its name stays in front only when what follows does not name the product itself
  while array_length(segs, 1) > 1 and (lower(segs[1]) = any(orgs)
        or lower(regexp_replace(segs[1], '\W', '', 'g')) = lower(regexp_replace(coalesce(p_creator, '#'), '\W', '', 'g'))) loop
    o0 := lower(segs[1]); n0 := lower(substring(segs[2] from '^[A-Za-z]+'));
    segs := segs[2:];
    if not (brands ? n0 or n0 = o0 or o0 like n0 || '%' or n0 like replace(o0, '-', '') || '%') then
      o := o || coalesce(orgnm ->> o0, case when brands ? o0 then brands ->> o0 else upper(left(o0, 1)) || substr(o0, 2) end);
    end if;
  end loop;
  foreach seg in array segs loop
    toks := regexp_split_to_array(btrim(seg), '[-_\s]+');
    i := 1;
    while i <= coalesce(array_length(toks, 1), 0) loop
      t := toks[i]; lt := lower(t);
      if t = '' then i := i + 1; continue; end if;
      -- snapshot dates: YYYY MM DD, MM YYYY, YYYYMMDD, MMDD
      if lt ~ '^(19|20)\d\d$' and i + 2 <= array_length(toks, 1) and toks[i+1] ~ '^(0[1-9]|1[0-2])$' and toks[i+2] ~ '^([0-2]\d|3[01])$' then
        dt := mon[toks[i+1]::int] || ' ' || toks[i+2]::int || ', ' || t; i := i + 3; continue; end if;
      if lt ~ '^(0?[1-9]|1[0-2])$' and i + 1 <= array_length(toks, 1) and toks[i+1] ~ '^(19|20)\d\d$' and (prev is null or prev !~ '\d$') then
        dt := mon[lt::int] || ' ' || toks[i+1]; i := i + 2; continue; end if;
      if lt ~ '^(19|20)\d\d(0[1-9]|1[0-2])([0-2]\d|3[01])$' then dt := mon[substr(lt, 5, 2)::int] || ' ' || substr(lt, 7, 2)::int || ', ' || substr(lt, 1, 4); i := i + 1; continue; end if;
      if lt ~ '^(0[1-9]|1[0-2])([0-2]\d|3[01])$' and i = array_length(toks, 1) then dt := lt; i := i + 1; continue; end if;
      if lt = 'latest' then dt := 'latest'; i := i + 1; continue; end if;
      -- a split version: qwen3 6 -> Qwen3.6, 3 5 -> 3.5, v2 1 -> v2.1
      if lt ~ '^\d{1,2}$' and prev is not null and prev ~ '\d$' and prev !~ '\d[BKMbkm]$' and prev !~ '\.' and array_length(o, 1) > 0 then
        o[array_length(o, 1)] := o[array_length(o, 1)] || '.' || lt; prev := o[array_length(o, 1)]; i := i + 1; continue; end if;
      if lt ~ '^\d+(\.\d+)?[bmk]$' or lt ~ '^[ae]\d+(\.\d+)?b$' or lt ~ '^\d+x\d+(\.\d+)?b$' then t := replace(upper(lt), 'X', 'x');
      elsif lt ~ '^\d+(\.\d+)?k$' then t := upper(lt);
      elsif lt ~ '^\d+p$' then t := lt;
      elsif lt ~ '^o\d' and coalesce(p_creator, '') = 'OpenAI' then t := lt;
      elsif lt ~ '^[rkm]\d+(\.\d+)*$' then t := upper(lt);
      elsif lt ~ '^v\d+(\.\d+)*$' then t := lt;
      elsif brands ? lt then t := brands ->> lt;
      elsif lt ~ '^[a-z]+\d' and brands ? substring(lt from '^[a-z]+') then t := (brands ->> substring(lt from '^[a-z]+')) || substring(lt from '^[a-z]+(.*)$');
      elsif t ~ '^[a-z]' then t := upper(left(t, 1)) || substr(t, 2);
      end if;
      if array_length(o, 1) > 0 and o[array_length(o, 1)] = any(hy) and (t ~ '^\d' or t ~ '^[VvRO]\d' or t in ('OSS', 'E')) then
        o[array_length(o, 1)] := o[array_length(o, 1)] || '-' || upper(left(t, 1)) || substr(t, 2);
      else
        o := o || t;
      end if;
      prev := o[array_length(o, 1)]; i := i + 1;
    end loop;
  end loop;
  res := array_to_string(o, ' ');
  res := regexp_replace(res, '^DALL-E', 'DALL·E');
  res := upper(left(res, 1)) || substr(res, 2);
  if dt <> '' then res := res || ' (' || dt || ')'; end if;
  return nullif(btrim(res), '') || suf;
end;
$$;
revoke all on function public.propose_display_name(text, text) from public, anon, authenticated;

-- Filled November 26, 2026: every model_registry row (anchors by rule, the same product listed twice gets
-- " (fal.ai)" on fal.ai's copy, aliases take their anchor's name), sizes upper-cased (70b -> 70B), and two hand
-- corrections (Qwen3.8 2.4T A95B; GPT-4o (November 20, 2024) Global). terminal_index_week overlays registry
-- display names on stored weeks at read time; v_fair_value_models carries display_name; build_terminal_week
-- uses it.

-- Registry health B1.42 (November 26, 2026): counts rows with no display_name. To review and apply:
--   SELECT * FROM v_display_name_missing;          -- proposed_name per new model; correct any in the statement below
--   WITH u AS (UPDATE model_registry r SET display_name = m.proposed_name FROM v_display_name_missing m
--              WHERE r.model_id = m.model_id RETURNING r.model_name, r.display_name) SELECT * FROM u;
