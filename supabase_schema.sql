-- ============================================================
-- English for Healthcare Professionals - Supabase Schema
-- Shared auth for future NCLEX app
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE cefr_level AS ENUM ('A0', 'A1', 'A2', 'B1', 'B2', 'C1');
CREATE TYPE user_role AS ENUM ('student', 'admin', 'case_manager');
CREATE TYPE validation_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE exam_type AS ENUM ('ielts_academic', 'toefl_ibt', 'pte_academic', 'undecided');
CREATE TYPE plan_type AS ENUM ('free', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');

-- ============================================================
-- PROFILES TABLE (Shared auth for future NCLEX app)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  country_code TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  profession TEXT NOT NULL DEFAULT '',
  license_number TEXT NOT NULL DEFAULT '',
  experience_years INT NOT NULL DEFAULT 0,
  exam_interest exam_type NOT NULL DEFAULT 'undecided',
  current_level cefr_level NOT NULL DEFAULT 'A0',
  global_progress INT NOT NULL DEFAULT 0, -- 0-100 percentage across all CEFR levels
  daily_goal INT NOT NULL DEFAULT 120, -- minutes
  daily_minutes_today INT NOT NULL DEFAULT 0,
  role user_role NOT NULL DEFAULT 'student',
  validation_status validation_status NOT NULL DEFAULT 'pending',
  validation_photo_url TEXT,
  validation_approved_at TIMESTAMPTZ,
  validation_photo_delete_at TIMESTAMPTZ, -- auto-delete 30 days after approval
  avatar_url TEXT,
  streak INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  total_xp INT NOT NULL DEFAULT 0,
  exam_path exam_type DEFAULT NULL, -- Chosen at B1
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FUNCTION: Check if the current user is an admin/case_manager.
-- SECURITY DEFINER so this bypasses RLS on `profiles` internally and
-- avoids infinite recursion when used inside a policy ON profiles itself.
CREATE OR REPLACE FUNCTION is_admin_or_case_manager(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = uid AND role IN ('admin', 'case_manager')
  );
$$;

-- RLS: Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin_or_case_manager(auth.uid()));

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (is_admin_or_case_manager(auth.uid()));

-- SECURITY: RLS above only checks WHICH ROW a user may touch, not WHICH
-- COLUMNS. Without this trigger, "Users can update own profile" lets any
-- student PATCH their own row and set role='admin', is_blocked=false,
-- validation_status='approved', total_xp=999999, etc. This trigger silently
-- reverts privileged fields back to their previous value unless the caller
-- is staff (admin/case_manager).
--
-- IMPORTANT: only enforced when auth.uid() is present, i.e. the update came
-- from the app through Supabase Auth (PostgREST as anon/authenticated).
-- Direct SQL (Supabase SQL Editor, service_role, migrations) has no JWT and
-- auth.uid() returns NULL there — that context is already fully trusted
-- (it bypasses RLS entirely too), so this trigger must not fight it.
CREATE OR REPLACE FUNCTION protect_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_admin_or_case_manager(auth.uid()) THEN
    NEW.role := OLD.role;
    NEW.is_blocked := OLD.is_blocked;
    NEW.validation_status := OLD.validation_status;
    NEW.validation_approved_at := OLD.validation_approved_at;
    NEW.validation_photo_delete_at := OLD.validation_photo_delete_at;
    NEW.total_xp := OLD.total_xp;
    NEW.streak := OLD.streak;
    NEW.global_progress := OLD.global_progress;
    NEW.current_level := OLD.current_level;
    NEW.id := OLD.id;
    NEW.email := OLD.email;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profile_fields
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_profile_privileged_fields();

-- ============================================================
-- LESSONS TABLE
-- ============================================================
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level cefr_level NOT NULL,
  "order" INT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  vocab_healthcare JSONB NOT NULL DEFAULT '[]'::jsonb,
  grammar_point JSONB NOT NULL DEFAULT '{}'::jsonb,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_checkpoint BOOLEAN NOT NULL DEFAULT false, -- every 4th lesson
  duration_minutes INT NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(level, "order")
);

-- RLS: Lessons (readable by all authenticated users)
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lessons"
  ON lessons FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage lessons"
  ON lessons FOR ALL
  USING (is_admin_or_case_manager(auth.uid()));

-- ============================================================
-- USER PROGRESS
-- ============================================================
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  score INT, -- 0-100
  time_spent INT NOT NULL DEFAULT 0, -- seconds
  vocab_score INT, -- sub-score
  grammar_score INT, -- sub-score
  listening_score INT, -- sub-score
  speaking_score INT, -- sub-score
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
  ON user_progress FOR SELECT
  USING (is_admin_or_case_manager(auth.uid()));

-- ============================================================
-- PLACEMENT TEST RESULTS
-- ============================================================
CREATE TABLE placement_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  initial_level cefr_level NOT NULL,
  score INT NOT NULL, -- 0-100
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE placement_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own placement"
  ON placement_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own placement"
  ON placement_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all placements"
  ON placement_results FOR SELECT
  USING (is_admin_or_case_manager(auth.uid()));

-- ============================================================
-- MESSAGES (Chat Admin <-> Student)
-- ============================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- ============================================================
-- SUBSCRIPTIONS (Stripe - ready for future activation)
-- ============================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan plan_type NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage subscriptions"
  ON subscriptions FOR ALL
  USING (is_admin_or_case_manager(auth.uid()));

-- ============================================================
-- SPEAKING RECORDINGS (for AI evaluation)
-- ============================================================
CREATE TABLE speaking_recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  audio_url TEXT NOT NULL,
  transcript TEXT,
  band_score_estimate DECIMAL(2,1), -- IELTS-style band score
  pronunciation_score INT, -- 0-100
  fluency_score INT, -- 0-100
  feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE speaking_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recordings"
  ON speaking_recordings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view recordings"
  ON speaking_recordings FOR SELECT
  USING (is_admin_or_case_manager(auth.uid()));

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_validation ON profiles(validation_status);
CREATE INDEX idx_profiles_current_level ON profiles(current_level);
CREATE INDEX idx_lessons_level_order ON lessons(level, "order");
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_lesson ON user_progress(lesson_id);
CREATE INDEX idx_messages_participants ON messages(sender_id, receiver_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_speaking_recordings_user ON speaking_recordings(user_id);

-- ============================================================
-- FUNCTION: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FUNCTION: Handle new user signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );

  INSERT INTO subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Run these in Supabase Dashboard SQL Editor

-- Bucket: validations (for credential/license photos)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('validations', 'validations', false, 1048576, ARRAY['image/webp','image/jpeg','image/png']);

-- Bucket: avatars
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/webp','image/jpeg','image/png']);

-- Bucket: speaking-audio
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('speaking-audio', 'speaking-audio', false, 10485760, ARRAY['audio/webm','audio/wav','audio/mp3']);

-- Storage RLS policies (apply after bucket creation):
-- validations: authenticated users can insert own, admins can read all
-- avatars: authenticated users can read all, owners can insert/update
-- speaking-audio: owners can insert/read, admins can read

-- ============================================================
-- EDGE FUNCTION PLACEHOLDER: Daily reminder email
-- ============================================================
-- Scheduled function (cron) to check users who haven't practiced today
-- and send email reminder. Deploy via Supabase CLI.
-- File: supabase/functions/daily-reminder/index.ts

-- ============================================================
-- SEED DATA: Example Lessons
-- ============================================================

-- A0 Lessons (instructions in Spanish, basic healthcare vocab)
INSERT INTO lessons (level, "order", title, subtitle, description, vocab_healthcare, grammar_point, content, is_checkpoint, duration_minutes) VALUES
('A0', 1, 'Greetings in Healthcare', 'Saludos en el entorno médico', 'Learn basic greetings used in hospitals and clinics. Aprende saludos básicos para usar en hospitales.',
 '[{"en":"Hello, how are you?","es":"Hola, ¿cómo estás?","context":"Greeting a patient"},{"en":"Good morning, I am your nurse","es":"Buenos días, soy tu enfermera","context":"Introducing yourself"},{"en":"Please, have a seat","es":"Por favor, tome asiento","context":"Directing a patient"},{"en":"My name is...","es":"Mi nombre es...","context":"Self-introduction"},{"en":"Nice to meet you","es":"Mucho gusto","context":"First meeting"}]'::jsonb,
 '{"topic":"Present Simple - Verb To Be","explanation":"I am / You are / He is / She is","examples":["I am a nurse","She is the doctor","You are the patient"]}'::jsonb,
 '{"listening":{"script":"Good morning. I am Sarah, your nurse today. How are you feeling?","questions":[{"q":"Who is speaking?","options":["The doctor","The nurse","The patient"],"correct":1}]},"quiz":[{"q":"Complete: I ___ a nurse","options":["is","am","are"],"correct":1},{"q":"My name ___ Maria","options":["am","is","are"],"correct":1}]}'::jsonb,
 false, 20),

('A0', 2, 'Parts of the Body', 'Partes del cuerpo', 'Essential vocabulary for body parts in medical contexts. Vocabulario esencial de partes del cuerpo.',
 '[{"en":"head","es":"cabeza","context":"Patient assessment"},{"en":"arm","es":"brazo","context":"Taking blood pressure"},{"en":"leg","es":"pierna","context":"Mobility assessment"},{"en":"chest","es":"pecho","context":"Listening to heartbeat"},{"en":"back","es":"espalda","context":"Pain assessment"}]'::jsonb,
 '{"topic":"Articles: a/an/the","explanation":"A before consonant, An before vowel, The for specific","examples":["a headache","an arm injury","the patient"]}'::jsonb,
 '{"listening":{"script":"The patient has pain in his left arm. Please check his blood pressure.","questions":[{"q":"Where is the pain?","options":["Right arm","Left arm","Chest"],"correct":1}]},"quiz":[{"q":"The patient has ___ headache","options":["a","an","the"],"correct":0},{"q":"She has ___ ear infection","options":["a","an","the"],"correct":1}]}'::jsonb,
 false, 20),

('A0', 3, 'Numbers and Vital Signs', 'Números y signos vitales', 'Learn numbers for taking vital signs. Aprende números para tomar signos vitales.',
 '[{"en":"blood pressure","es":"presión arterial","context":"Vital signs measurement"},{"en":"temperature","es":"temperatura","context":"Fever check"},{"en":"heart rate","es":"ritmo cardíaco","context":"Pulse check"},{"en":"one hundred twenty over eighty","es":"ciento veinte sobre ochenta","context":"Reading BP"},{"en":"degrees Celsius","es":"grados centígrados","context":"Temperature reading"}]'::jsonb,
 '{"topic":"Numbers 1-200","explanation":"Cardinal numbers for medical readings","examples":["120/80","98.6°F","72 bpm"]}'::jsonb,
 '{"listening":{"script":"The patients blood pressure is one hundred thirty over eighty-five. Temperature is thirty-seven point two.","questions":[{"q":"What is the blood pressure?","options":["120/80","130/85","140/90"],"correct":1}]},"quiz":[{"q":"Normal body temperature in Celsius is about ___ degrees","options":["35","37","39"],"correct":1}]}'::jsonb,
 false, 20),

('A0', 4, 'Checkpoint: Basic Communication', 'Evaluación: Comunicación básica', 'Review and assessment of greetings, body parts, and vital signs. Evaluación de lo aprendido.',
 '[]'::jsonb,
 '{}'::jsonb,
 '{"is_checkpoint":true,"review_lessons":[1,2,3],"passing_score":70,"questions":[
   {"q":"How do you introduce yourself to a patient?","options":["Goodbye","I am your nurse","Where is the bathroom?"],"correct":1},
   {"q":"What is the correct article: ___ headache","options":["a","an","the"],"correct":0},
   {"q":"Normal blood pressure is around...","options":["200/100","120/80","90/60"],"correct":1},
   {"q":"How do you say ''brazo'' in English?","options":["Leg","Arm","Chest"],"correct":1},
   {"q":"She ___ the doctor","options":["am","is","are"],"correct":1}
 ]}'::jsonb,
 true, 25),

('A0', 5, 'Common Symptoms', 'Síntomas comunes', 'How to ask about and describe common symptoms. Cómo preguntar sobre síntomas comunes.',
 '[{"en":"headache","es":"dolor de cabeza","context":"Pain assessment"},{"en":"fever","es":"fiebre","context":"Vital signs"},{"en":"cough","es":"tos","context":"Respiratory"},{"en":"nausea","es":"náusea","context":"General symptoms"},{"en":"dizziness","es":"mareo","context":"General symptoms"}]'::jsonb,
 '{"topic":"Present Simple Questions","explanation":"Do/Does for questions","examples":["Do you have a headache?","Does the patient have fever?"]}'::jsonb,
 '{"listening":{"script":"Patient says: I have a bad headache and I feel dizzy. I also have a cough since yesterday.","questions":[{"q":"How many symptoms does the patient mention?","options":["Two","Three","Four"],"correct":1}]},"quiz":[{"q":"___ you have a fever?","options":["Do","Does","Is"],"correct":0},{"q":"The patient complains of ___ and dizziness","options":["fever","headache","cough"],"correct":1}]}'::jsonb,
 false, 20),

-- A1 Lessons (bilingual ES/EN scaffolding, same as A0)
('A1', 1, 'Meeting the Patient', 'Preguntas básicas al paciente', 'Learn to ask basic questions when meeting a new patient. Aprende a hacer preguntas básicas al conocer a un nuevo paciente.',
 '[{"en":"What''s your name?","es":"¿Cómo te llamas?","context":"Patient intake"},{"en":"How old are you?","es":"¿Cuántos años tienes?","context":"Patient intake"},{"en":"Where are you from?","es":"¿De dónde eres?","context":"Getting to know the patient"},{"en":"date of birth","es":"fecha de nacimiento","context":"Registration form"},{"en":"occupation","es":"ocupación","context":"Patient profile"}]'::jsonb,
 '{"topic":"Present Simple - WH Questions","explanation":"Use What, How, Where + is/do/does to ask about facts. Usa What, How, Where + is/do/does para preguntar datos.","examples":["What''s your name?","How old are you?","Where do you live?","What''s your occupation?"]}'::jsonb,
 '{"listening":{"script":"Good morning. Can I ask you a few questions? What''s your name, please? And how old are you? Where are you from originally?","questions":[{"q":"What is the nurse asking about?","options":["Symptoms","Personal information","Medication"],"correct":1}]},"quiz":[{"q":"___ is your name?","options":["What","Where","How"],"correct":0},{"q":"___ old are you?","options":["What","How","Where"],"correct":1}]}'::jsonb,
 false, 20),

('A1', 2, 'Daily Ward Routine', 'Present Simple para rutinas', 'Talk about daily hospital routines and schedules. Habla sobre las rutinas y horarios diarios del hospital.',
 '[{"en":"wake up","es":"despertarse","context":"Morning routine"},{"en":"check vitals","es":"revisar signos vitales","context":"Nursing routine"},{"en":"shift","es":"turno","context":"Work schedule"},{"en":"every morning","es":"cada mañana","context":"Frequency"},{"en":"medication round","es":"ronda de medicamentos","context":"Ward routine"}]'::jsonb,
 '{"topic":"Present Simple for Routines","explanation":"Use Present Simple (+s for he/she/it) to talk about habits and routines. Usa el presente simple (+s para he/she/it) para hablar de hábitos y rutinas.","examples":["The nurse checks vitals every morning.","I start my shift at 7am.","Patients wake up at 6am.","We do medication rounds twice a day."]}'::jsonb,
 '{"listening":{"script":"My shift starts at seven in the morning. First, I check the patients'' vital signs. Then, at eight, we do the medication round. Lunch is at noon.","questions":[{"q":"What time does the shift start?","options":["6am","7am","8am"],"correct":1}]},"quiz":[{"q":"The nurse ___ vitals every morning.","options":["check","checks","checking"],"correct":1},{"q":"I ___ my shift at 7am.","options":["start","starts","starting"],"correct":0}]}'::jsonb,
 false, 20),

('A1', 3, 'Family & Emergency Contact', 'Posesivos y vocabulario familiar', 'Ask about a patient''s family and emergency contact information. Pregunta sobre la familia del paciente y su contacto de emergencia.',
 '[{"en":"emergency contact","es":"contacto de emergencia","context":"Admission form"},{"en":"spouse","es":"cónyuge / esposo(a)","context":"Family information"},{"en":"next of kin","es":"pariente más cercano","context":"Hospital records"},{"en":"relationship","es":"parentesco","context":"Emergency contact form"},{"en":"phone number","es":"número de teléfono","context":"Contact details"}]'::jsonb,
 '{"topic":"Possessive ''s and Family Vocabulary","explanation":"Use ''s to show who something belongs to. Usa ''s para mostrar posesión (ej. the patient''s husband).","examples":["What''s your husband''s name?","This is my sister''s number.","Who is the patient''s next of kin?","Her mother''s phone number is..."]}'::jsonb,
 '{"listening":{"script":"Can you give me your emergency contact, please? What''s your spouse''s name and phone number? What is their relationship to you?","questions":[{"q":"What is the nurse asking for?","options":["Medical history","Emergency contact information","Insurance details"],"correct":1}]},"quiz":[{"q":"This is my ___ number. (sister)","options":["sister","sister''s","sisters"],"correct":1},{"q":"Who is the patient''s ___ of kin?","options":["next","near","close"],"correct":0}]}'::jsonb,
 false, 20),

('A1', 4, 'Checkpoint: Basic Patient Interaction', 'Evaluación: Interacción básica con el paciente', 'Review greetings, patient questions, routines, and family vocabulary. Repaso de preguntas al paciente, rutinas y vocabulario familiar.',
 '[]'::jsonb,
 '{"topic":"Review","explanation":"Review of lessons 1-3","examples":[]}'::jsonb,
 '{"is_checkpoint":true,"review_lessons":[1,2,3],"passing_score":70,"questions":[{"q":"How do you ask a patient''s name?","options":["What''s your name?","How''s your name?","Who''s your name?"],"correct":0},{"q":"''Every morning'' shows a:","options":["Single event","Routine/habit","Question"],"correct":1},{"q":"''Next of kin'' means:","options":["Doctor","Closest relative","Medicine"],"correct":1},{"q":"The nurse ___ (check) vitals every day.","options":["check","checks","checking"],"correct":1},{"q":"''Occupation'' means:","options":["Job","Age","Address"],"correct":0}]}'::jsonb,
 true, 25),

('A1', 5, 'How Are You Feeling?', 'Expresar sentimientos y necesidades básicas', 'Learn to describe how you feel and express basic needs. Aprende a describir cómo te sientes y expresar necesidades básicas.',
 '[{"en":"I feel...","es":"me siento...","context":"Describing feelings"},{"en":"I have pain","es":"tengo dolor","context":"Describing symptoms"},{"en":"pain scale","es":"escala de dolor","context":"Pain assessment"},{"en":"I need...","es":"necesito...","context":"Expressing needs"},{"en":"thirsty / hungry","es":"con sed / con hambre","context":"Basic needs"}]'::jsonb,
 '{"topic":"I feel / I have / I need","explanation":"Use ''I feel'' + adjective, ''I have'' + noun, and ''I need'' + noun to talk about your state and needs. Usa ''I feel'' + adjetivo, ''I have'' + sustantivo, ''I need'' + sustantivo.","examples":["I feel dizzy.","I have a headache.","I need some water.","I feel better today."]}'::jsonb,
 '{"listening":{"script":"On a scale from one to ten, how much pain do you feel? I feel a lot of pain, maybe an eight. I also feel a little dizzy and I need some water.","questions":[{"q":"How much pain does the patient feel?","options":["Two","Five","Eight"],"correct":2}]},"quiz":[{"q":"I ___ dizzy.","options":["feel","have","need"],"correct":0},{"q":"I ___ a headache.","options":["feel","have","am"],"correct":1}]}'::jsonb,
 false, 20),

-- A2 Lessons (English-primary, definition-style vocab like B1)
('A2', 1, 'What Happened? Taking a Brief History', 'Simple Past for Patient History', 'Ask and describe what happened using the simple past tense.',
 '[{"en":"fall","definition":"To drop down suddenly by accident","context":"Injury history"},{"en":"onset","definition":"The moment a symptom or illness begins","context":"Medical history"},{"en":"twist","definition":"To injure a joint by turning it awkwardly","context":"Injury description"},{"en":"collapse","definition":"To suddenly fall down, often from weakness or fainting","context":"Emergency history"},{"en":"since","definition":"From a point in the past until now","context":"Duration of symptoms"}]'::jsonb,
 '{"topic":"Simple Past Tense","explanation":"Use the simple past to describe completed actions or events. Regular verbs add -ed (twisted, collapsed); many common verbs are irregular (fall→fell, break→broke).","examples":["The pain started yesterday.","She fell down the stairs.","He twisted his ankle.","I felt dizzy this morning."]}'::jsonb,
 '{"listening":{"script":"Tell me what happened. I was walking down the stairs and I fell. I twisted my ankle and it started to swell immediately.","questions":[{"q":"What did the patient injure?","options":["Wrist","Ankle","Knee"],"correct":1}]},"quiz":[{"q":"The pain ___ (start) yesterday.","options":["start","started","starts"],"correct":1},{"q":"She ___ (fall) down the stairs.","options":["fall","falled","fell"],"correct":2}]}'::jsonb,
 false, 20),

('A2', 2, 'Comparing Symptoms', 'Comparatives for Describing Change', 'Describe whether symptoms are improving or worsening using comparatives.',
 '[{"en":"worse","definition":"More severe or bad than before","context":"Symptom comparison"},{"en":"better","definition":"Improved compared to before","context":"Symptom comparison"},{"en":"higher","definition":"Greater in level or amount","context":"Vital signs comparison"},{"en":"lower","definition":"Smaller in level or amount","context":"Vital signs comparison"},{"en":"than before","definition":"Compared to an earlier time","context":"Describing change"}]'::jsonb,
 '{"topic":"Comparative Adjectives","explanation":"Use comparatives to compare two states. Short adjectives add -er (higher, lower); irregular ones change completely (bad→worse, good→better).","examples":["Is the pain better or worse today?","My fever is higher than yesterday.","I feel worse than before.","Her blood pressure is lower now."]}'::jsonb,
 '{"listening":{"script":"How do you feel compared to yesterday? Actually, I feel much better. The pain is less than before, but I still feel a little weak.","questions":[{"q":"How does the patient feel today?","options":["Worse","Better","The same"],"correct":1}]},"quiz":[{"q":"My fever is ___ than yesterday. (high)","options":["high","higher","highest"],"correct":1},{"q":"I feel ___ today. (bad → comparative)","options":["worse","bad","badder"],"correct":0}]}'::jsonb,
 false, 20),

('A2', 3, 'Instructions & Procedures', 'Imperatives and Sequencing', 'Give clear step-by-step instructions using imperatives and sequence words.',
 '[{"en":"first","definition":"Used to introduce the initial step","context":"Sequencing instructions"},{"en":"then / next","definition":"Used to introduce the following step","context":"Sequencing instructions"},{"en":"finally","definition":"Used to introduce the last step","context":"Sequencing instructions"},{"en":"breathe in / breathe out","definition":"To inhale / to exhale","context":"Physical exam instructions"},{"en":"hold still","definition":"Do not move","context":"Procedure instructions"}]'::jsonb,
 '{"topic":"Imperatives for Instructions","explanation":"Use the base form of the verb (no subject) to give instructions. Sequence words like first, then, next, finally help organize steps clearly.","examples":["First, take a deep breath.","Then, hold it for five seconds.","Next, breathe out slowly.","Finally, relax your arm."]}'::jsonb,
 '{"listening":{"script":"Please follow my instructions. First, sit down and relax. Then, breathe in slowly through your nose. Hold it for three seconds. Finally, breathe out through your mouth.","questions":[{"q":"What is the first instruction?","options":["Breathe out","Sit down and relax","Hold your breath"],"correct":1}]},"quiz":[{"q":"___, take a deep breath. (first step)","options":["First","Finally","Then"],"correct":0},{"q":"Please ___ still while I check your arm.","options":["holds","hold","holding"],"correct":1}]}'::jsonb,
 false, 20),

('A2', 4, 'Checkpoint: Describing Change and Giving Instructions', 'Evaluación: Historia clínica, comparativos e instrucciones', 'Review past tense history-taking, comparatives, and giving instructions.',
 '[]'::jsonb,
 '{"topic":"Review","explanation":"Review of lessons 1-3","examples":[]}'::jsonb,
 '{"is_checkpoint":true,"review_lessons":[1,2,3],"passing_score":70,"questions":[{"q":"She ___ (fall) down the stairs.","options":["fall","falled","fell"],"correct":2},{"q":"My fever is ___ than yesterday. (high)","options":["high","higher","highest"],"correct":1},{"q":"___, take a deep breath. (first step)","options":["First","Finally","Then"],"correct":0},{"q":"''Onset'' means:","options":["The end of an illness","The beginning of a symptom","A type of medicine"],"correct":1},{"q":"''Hold still'' means:","options":["Move quickly","Do not move","Breathe deeply"],"correct":1}]}'::jsonb,
 true, 25),

('A2', 5, 'Family Medical History', 'Have/Has for Family Health Background', 'Ask about a patient''s family medical history using have/has.',
 '[{"en":"family history","definition":"Health conditions that run in a patient''s family","context":"Medical history form"},{"en":"diabetes","definition":"A condition causing high blood sugar","context":"Common chronic condition"},{"en":"heart disease","definition":"A condition affecting the heart","context":"Common chronic condition"},{"en":"allergic to","definition":"Having a bad reaction to a substance","context":"Allergy history"},{"en":"run in the family","definition":"To be a health condition common among relatives","context":"Family history idiom"}]'::jsonb,
 '{"topic":"Have/Has for Possession and Health Conditions","explanation":"Use ''have'' with I/you/we/they and ''has'' with he/she/it to talk about health conditions.","examples":["Does your mother have diabetes?","My father has heart disease.","Do you have any allergies?","She has no family history of cancer."]}'::jsonb,
 '{"listening":{"script":"Does anyone in your family have diabetes or heart disease? Yes, my father has heart disease and my grandmother had diabetes.","questions":[{"q":"What condition does the patient''s father have?","options":["Diabetes","Heart disease","Allergies"],"correct":1}]},"quiz":[{"q":"___ your mother have diabetes?","options":["Does","Do","Is"],"correct":0},{"q":"My father ___ heart disease.","options":["have","has","having"],"correct":1}]}'::jsonb,
 false, 20),

-- B1 Lessons (all in English, real healthcare scenarios)
('B1', 1, 'Patient Handover - ISBAR', 'Clinical Communication', 'Master the ISBAR framework for structured patient handovers between shifts.',
 '[{"en":"handover","definition":"The transfer of patient care responsibility from one provider to another","context":"End of shift report"},{"en":"deterioration","definition":"A decline in patient condition","context":"Patient status"},{"en":"vital signs stable","definition":"Blood pressure, heart rate, temperature within normal range","context":"Patient assessment"},{"en":"plan of care","definition":"The documented treatment approach for a patient","context":"Nursing process"},{"en":"escalation","definition":"The process of raising concerns to senior staff","context":"Clinical urgency"}]'::jsonb,
 '{"topic":"ISBAR Framework","explanation":"Introduction, Situation, Background, Assessment, Recommendation","examples":["I: I am calling about Mr. Smith in Room 302","S: His blood pressure has dropped to 90/60","B: He was admitted yesterday with pneumonia","A: I think he may be dehydrated","R: I recommend starting IV fluids"]}'::jsonb,
 '{"listening":{"script":"Hi, this is Nurse Chen from Ward 4B. I am calling about Mrs. Rodriguez, a 68-year-old patient in room 412. She was admitted three days ago post-hip surgery. Her vital signs were stable until an hour ago when her heart rate increased to 110 and her oxygen saturation dropped to 92%. She is also complaining of shortness of breath. Given her recent surgery, I am concerned about a possible pulmonary embolism. I recommend an urgent CT scan and would like you to review her immediately.","questions":[{"q":"What is the ISBAR framework used for?","options":["Medication calculation","Patient handover","Diagnosing illness"],"correct":1},{"q":"What condition does the nurse suspect?","options":["Pneumonia","Pulmonary embolism","Heart attack"],"correct":1}]},"quiz":[{"q":"In ISBAR, ''S'' stands for:","options":["Symptoms","Situation","Surgery"],"correct":1},{"q":"Which ISBAR component includes vital signs?","options":["Introduction","Assessment","Background"],"correct":1}]}'::jsonb,
 false, 30),

('B1', 2, 'Taking Patient History', 'Clinical Assessment', 'Learn to take a comprehensive patient history using the SOCRATES framework for pain assessment and standard history-taking questions.',
 '[{"en":"onset","definition":"When symptoms began","context":"Pain assessment"},{"en":"aggravating factors","definition":"Things that make the condition worse","context":"Assessment"},{"en":"past medical history","definition":"Previous illnesses and conditions","context":"History taking"},{"en":"medication reconciliation","definition":"Reviewing all current medications","context":"Admission process"},{"en":"chief complaint","definition":"The primary reason for seeking medical attention","context":"Patient interview"}]'::jsonb,
 '{"topic":"Question Formation for History Taking","explanation":"Open-ended vs closed questions, probing techniques","examples":["Can you describe the pain?","When did it start?","What makes it better or worse?","Have you had this before?"]}'::jsonb,
 '{"listening":{"script":"Patient interview: I have been having this chest pain for about two days. It started suddenly while I was walking. It feels like pressure, not sharp. On a scale of 1 to 10, I would say it is a 6. It gets worse when I walk and better when I sit down. I also feel a bit short of breath. I have high blood pressure and I take lisinopril 10mg daily.","questions":[{"q":"What is the patients chief complaint?","options":["Headache","Chest pain","Back pain"],"correct":1},{"q":"When did the pain start?","options":["Two weeks ago","Two days ago","Two hours ago"],"correct":1}]},"quiz":[{"q":"What does SOCRATES assess?","options":["Vital signs","Pain characteristics","Lab results"],"correct":1},{"q":"An ''aggravating factor'' makes symptoms...","options":["Better","Worse","No change"],"correct":1}]}'::jsonb,
 false, 30),

('B1', 3, 'Medication Administration', 'Pharmacology Basics', 'Vocabulary and communication for safe medication administration including the 5 Rights of medication.',
 '[{"en":"dosage","definition":"The amount of medication to be given","context":"Medication chart"},{"en":"route of administration","definition":"How medication enters the body (oral, IV, IM, etc.)","context":"Drug administration"},{"en":"contraindication","definition":"A condition where a drug should not be used","context":"Drug safety"},{"en":"adverse reaction","definition":"An unwanted or harmful effect of a medication","context":"Patient monitoring"},{"en":"therapeutic effect","definition":"The intended beneficial result of a medication","context":"Treatment outcome"}]'::jsonb,
 '{"topic":"Passive Voice in Clinical Notes","explanation":"Using passive voice for objective clinical documentation","examples":["The medication was administered at 0800","Vital signs were recorded before administration","The patient was observed for 30 minutes post-injection"]}'::jsonb,
 '{"listening":{"script":"Before administering this medication, please verify the five rights: right patient, right drug, right dose, right route, and right time. Check the patients ID band and ask for their name and date of birth. This patient is allergic to penicillin, so make sure you document that clearly.","questions":[{"q":"How many rights of medication are mentioned?","options":["Three","Four","Five"],"correct":2},{"q":"What allergy does the patient have?","options":["Aspirin","Penicillin","Ibuprofen"],"correct":1}]},"quiz":[{"q":"The medication ___ administered at 0800 (passive)","options":["is","was","were"],"correct":1},{"q":"A contraindication means the drug...","options":["Should be given","Should NOT be given","Is optional"],"correct":1}]}'::jsonb,
 false, 30),

('B1', 4, 'Checkpoint: Clinical Communication', 'Mid-Level Assessment', 'Comprehensive review of patient handover, history taking, and medication administration.',
 '[]'::jsonb,
 '{}'::jsonb,
 '{"is_checkpoint":true,"review_lessons":[1,2,3],"passing_score":75,"questions":[
   {"q":"What does ISBAR stand for?","options":["Introduction, Situation, Background, Assessment, Recommendation","Identify, Situation, Background, Action, Review","Initial, Status, Basic, Assessment, Response"],"correct":0},
   {"q":"The five rights of medication include all EXCEPT:","options":["Right patient","Right diagnosis","Right dose"],"correct":1},
   {"q":"In SOCRATES pain assessment, ''O'' stands for:","options":["Observation","Onset","Operation"],"correct":1},
   {"q":"A patient says their pain gets ''worse when walking'' - this is called:","options":["An aggravating factor","A relieving factor","A side effect"],"correct":0},
   {"q":"In a handover, vital signs belong in which ISBAR component?","options":["Introduction","Situation","Assessment"],"correct":2}
 ]}'::jsonb,
 true, 35),

('B1', 5, 'Infection Control', 'Safety & Prevention', 'Master infection control terminology including PPE, standard precautions, and isolation protocols.',
 '[{"en":"personal protective equipment","definition":"Equipment worn to minimize exposure to hazards","context":"Infection prevention"},{"en":"hand hygiene","definition":"Cleaning hands to prevent transmission of pathogens","context":"Standard precautions"},{"en":"transmission-based precautions","definition":"Additional infection control measures for specific diseases","context":"Isolation protocols"},{"en":"aseptic technique","definition":"Practices to maintain sterility and prevent contamination","context":"Clinical procedures"},{"en":"nosocomial infection","definition":"An infection acquired in a healthcare facility","context":"Patient safety"}]'::jsonb,
 '{"topic":"Modal Verbs for Protocols","explanation":"Must, should, have to for clinical obligations","examples":["You must wash your hands before patient contact","PPE should be worn in isolation rooms","Staff have to complete annual infection control training"]}'::jsonb,
 '{"listening":{"script":"Attention all staff: we have a confirmed case of MRSA in Ward 3. Contact precautions are now in effect. You must wear gloves and a gown when entering the patient''s room. Hand hygiene must be performed before and after patient contact. The patient has been moved to a single room. Visitors are limited to two at a time and must also wear PPE.","questions":[{"q":"What type of precautions are in effect?","options":["Droplet precautions","Contact precautions","Airborne precautions"],"correct":1},{"q":"What PPE is required?","options":["Gloves only","Gloves and gown","Full PPE including N95"],"correct":1}]},"quiz":[{"q":"You ___ wash hands before patient contact","options":["might","must","could"],"correct":1},{"q":"A nosocomial infection is acquired in a...","options":["Community","Healthcare facility","School"],"correct":1}]}'::jsonb,
 false, 30);

-- B2 Lessons (English-primary, definition-style vocab like B1)
INSERT INTO lessons (level, "order", title, subtitle, description, vocab_healthcare, grammar_point, content, is_checkpoint, duration_minutes) VALUES
('B2', 1, 'Explaining Diagnosis & Treatment Options', 'Modals for Advice and Possibility', 'Explain diagnoses and discuss treatment options using modal verbs.',
 '[{"en":"prognosis","definition":"The likely course or outcome of a medical condition","context":"Discussing diagnosis"},{"en":"side effect","definition":"An unwanted effect of a medication or treatment","context":"Treatment options"},{"en":"recommend","definition":"To suggest something as the best option","context":"Giving medical advice"},{"en":"underlying condition","definition":"A health problem that is the root cause of symptoms","context":"Diagnosis"},{"en":"risk factor","definition":"Something that increases the chance of developing a condition","context":"Assessing risk"}]'::jsonb,
 '{"topic":"Modal Verbs for Advice and Possibility","explanation":"Use ''should'' for recommendations, ''might/could'' for possibility, and ''must'' for strong necessity when discussing diagnosis and treatment.","examples":["You should take this medication twice a day.","This might be a side effect of the treatment.","We could try a different approach.","You must avoid alcohol with this medication."]}'::jsonb,
 '{"listening":{"script":"Based on your symptoms, this could be related to your blood pressure medication. You should schedule a follow-up in two weeks. We might need to adjust your dosage.","questions":[{"q":"What does the doctor suggest?","options":["Stop all medication","Schedule a follow-up","Go to the emergency room"],"correct":1}]},"quiz":[{"q":"You ___ take this medication with food.","options":["should","must not","couldn''t"],"correct":0},{"q":"This ___ be a side effect.","options":["should","might","must"],"correct":1}]}'::jsonb,
 false, 25),

('B2', 2, 'Passive Voice in Clinical Reports', 'Passive Voice for Objective Reporting', 'Use passive voice to write and speak about clinical procedures and reports objectively.',
 '[{"en":"administered","definition":"Given to a patient (medication or treatment)","context":"Clinical documentation"},{"en":"documented","definition":"Recorded in writing, usually in medical notes","context":"Clinical documentation"},{"en":"referred","definition":"Sent to see another specialist or department","context":"Patient care coordination"},{"en":"discharged","definition":"Formally allowed to leave the hospital","context":"End of treatment"},{"en":"conducted","definition":"Carried out or performed (a test or procedure)","context":"Clinical procedures"}]'::jsonb,
 '{"topic":"Passive Voice (is/was + past participle)","explanation":"Use the passive voice when the action matters more than who did it — common in clinical documentation and handovers.","examples":["The medication was administered at 8am.","Tests were conducted this morning.","The patient was referred to cardiology.","She was discharged yesterday."]}'::jsonb,
 '{"listening":{"script":"The patient was admitted last night with chest pain. An ECG was conducted and blood tests were ordered. She was referred to cardiology for further evaluation.","questions":[{"q":"Why was the patient referred to cardiology?","options":["Routine checkup","Chest pain","A broken bone"],"correct":1}]},"quiz":[{"q":"The medication ___ administered at 8am.","options":["was","is being","has"],"correct":0},{"q":"Tests ___ conducted this morning.","options":["was","were","is"],"correct":1}]}'::jsonb,
 false, 25),

('B2', 3, 'Reported Speech: Relaying Patient Information', 'Indirect Speech for Handovers', 'Relay what a patient or colleague said using reported speech.',
 '[{"en":"mentioned","definition":"Said something briefly, often in passing","context":"Reporting what someone said"},{"en":"complained of","definition":"Reported a symptom or problem","context":"Reporting patient symptoms"},{"en":"stated","definition":"Said clearly and directly","context":"Formal reporting"},{"en":"denied","definition":"Said that something was not true","context":"Reporting negative findings"},{"en":"according to","definition":"As stated or reported by","context":"Attributing information"}]'::jsonb,
 '{"topic":"Reported Speech","explanation":"When relaying what someone said, shift the tense back: ''I feel dizzy'' becomes ''She said she felt dizzy''. Common reporting verbs: said, mentioned, stated, complained of, denied.","examples":["She said she felt dizzy.","He mentioned that the pain started yesterday.","The patient complained of nausea.","He denied having any allergies."]}'::jsonb,
 '{"listening":{"script":"The patient said she had been feeling tired for two weeks. She mentioned that she also had trouble sleeping. She denied any chest pain or shortness of breath.","questions":[{"q":"What did the patient deny?","options":["Feeling tired","Trouble sleeping","Chest pain"],"correct":2}]},"quiz":[{"q":"She said she ___ dizzy. (feel)","options":["feels","felt","feeling"],"correct":1},{"q":"He ___ having any allergies.","options":["denied","denies","deny"],"correct":0}]}'::jsonb,
 false, 25),

('B2', 4, 'Checkpoint: Clinical Reporting & Modals', 'Evaluación: Modales, voz pasiva y discurso indirecto', 'Review modals, passive voice, and reported speech for clinical communication.',
 '[]'::jsonb,
 '{"topic":"Review","explanation":"Review of lessons 1-3","examples":[]}'::jsonb,
 '{"is_checkpoint":true,"review_lessons":[1,2,3],"passing_score":70,"questions":[{"q":"You ___ take this medication with food.","options":["should","must not","couldn''t"],"correct":0},{"q":"The medication ___ administered at 8am.","options":["was","is being","has"],"correct":0},{"q":"She said she ___ dizzy. (feel)","options":["feels","felt","feeling"],"correct":1},{"q":"''Prognosis'' means:","options":["A type of medication","The likely outcome of a condition","A hospital department"],"correct":1},{"q":"''Discharged'' means:","options":["Admitted to hospital","Formally allowed to leave","Given medication"],"correct":1}]}'::jsonb,
 true, 30),

('B2', 5, 'Difficult Conversations: Breaking News & Handling Concerns', 'Softening Language and Empathy Phrases', 'Use softening language and empathy phrases to handle difficult conversations with patients.',
 '[{"en":"I''m afraid...","definition":"A polite way to introduce bad or difficult news","context":"Breaking news"},{"en":"unfortunately","definition":"Used to introduce disappointing information","context":"Delivering bad news"},{"en":"I understand this is difficult","definition":"An empathy phrase acknowledging emotional impact","context":"Showing empathy"},{"en":"reassure","definition":"To say something to reduce someone''s worry","context":"Comforting a patient"},{"en":"address your concerns","definition":"To respond to and deal with someone''s worries","context":"Handling complaints"}]'::jsonb,
 '{"topic":"Softening Language for Sensitive Topics","explanation":"Use hedging phrases and empathy statements to deliver difficult news gently: ''I''m afraid...'', ''Unfortunately...'', ''I understand this is difficult, but...''","examples":["I''m afraid the results show...","Unfortunately, we need to run more tests.","I understand this is difficult news.","Let me reassure you that we''ll take good care of you."]}'::jsonb,
 '{"listening":{"script":"I''m afraid the test results show some abnormalities. I understand this is difficult news to hear. Let me explain what the next steps will be, and I want to reassure you that we''re here to support you.","questions":[{"q":"What is the doctor''s tone in this conversation?","options":["Angry","Empathetic and reassuring","Indifferent"],"correct":1}]},"quiz":[{"q":"''I''m afraid...'' is used to:","options":["Show fear","Introduce difficult news gently","Ask a question"],"correct":1},{"q":"''Reassure'' means to:","options":["Increase worry","Reduce someone''s worry","Ignore someone"],"correct":1}]}'::jsonb,
 false, 25);

-- C1 Lessons (English-primary, definition-style vocab like B1)
INSERT INTO lessons (level, "order", title, subtitle, description, vocab_healthcare, grammar_point, content, is_checkpoint, duration_minutes) VALUES
('C1', 1, 'Advanced Clinical Reasoning & Differential Diagnosis', 'Hedging Language for Clinical Uncertainty', 'Discuss differential diagnoses and clinical uncertainty using advanced hedging language.',
 '[{"en":"differential diagnosis","definition":"A list of possible conditions that could explain a patient''s symptoms","context":"Clinical reasoning"},{"en":"presumptive","definition":"Assumed to be true based on available evidence, though not confirmed","context":"Diagnosis"},{"en":"rule out","definition":"To eliminate a possibility through testing","context":"Diagnostic process"},{"en":"inconclusive","definition":"Not leading to a definite conclusion","context":"Test results"},{"en":"warrant further investigation","definition":"To justify additional testing or examination","context":"Clinical decision-making"}]'::jsonb,
 '{"topic":"Hedging Language for Clinical Uncertainty","explanation":"Use hedging expressions to communicate uncertainty professionally: ''This could indicate...'', ''It''s possible that...'', ''I suspect...'', ''This may warrant further investigation.''","examples":["This could indicate an underlying infection.","It''s possible that the symptoms are unrelated.","I suspect this may be a drug interaction.","These results warrant further investigation."]}'::jsonb,
 '{"listening":{"script":"Based on the presenting symptoms, this could indicate several possibilities. It''s possible we''re dealing with an atypical presentation of pneumonia, though I can''t rule out a pulmonary embolism at this stage. The inconclusive chest X-ray certainly warrants further investigation — I''d recommend a CT angiogram to clarify.","questions":[{"q":"What does the speaker want to do next?","options":["Discharge the patient","Order a CT angiogram","Stop all tests"],"correct":1}]},"quiz":[{"q":"''Rule out'' means to:","options":["Confirm a diagnosis","Eliminate a possibility","Schedule a test"],"correct":1},{"q":"''Presumptive'' means:","options":["Confirmed with certainty","Assumed based on evidence, not confirmed","Completely unknown"],"correct":1}]}'::jsonb,
 false, 30),

('C1', 2, 'Persuasive Communication: Advocating for Patients', 'Emphatic Structures and Argumentation', 'Advocate effectively for patients using emphatic and persuasive language structures.',
 '[{"en":"advocate for","definition":"To publicly support or argue in favor of someone''s needs","context":"Patient advocacy"},{"en":"it is imperative that","definition":"A formal way to stress something is essential","context":"Emphatic argumentation"},{"en":"compelling","definition":"Convincing or persuasive","context":"Making a case"},{"en":"undermine","definition":"To weaken or damage, often gradually","context":"Discussing risks"},{"en":"in light of","definition":"Considering or taking into account","context":"Making a case based on evidence"}]'::jsonb,
 '{"topic":"Emphatic Structures for Advocacy","explanation":"Use emphatic structures to make a persuasive case: ''It is imperative that...'', ''What concerns me most is...'', ''In light of these findings, I strongly recommend...''","examples":["It is imperative that we address this immediately.","What concerns me most is the delay in treatment.","In light of these findings, I strongly recommend a specialist referral.","This is a compelling case for immediate action."]}'::jsonb,
 '{"listening":{"script":"It is imperative that we escalate this case. What concerns me most is that the patient''s condition has been deteriorating for hours without adequate intervention. In light of these findings, I strongly recommend an immediate consultation with the on-call specialist.","questions":[{"q":"What is the speaker''s main concern?","options":["Paperwork delays","The patient''s deteriorating condition","Staff scheduling"],"correct":1}]},"quiz":[{"q":"''It is imperative that'' expresses:","options":["A suggestion","Something essential/urgent","A minor preference"],"correct":1},{"q":"''Advocate for'' means to:","options":["Argue against someone","Support someone''s needs","Ignore a situation"],"correct":1}]}'::jsonb,
 false, 30),

('C1', 3, 'Idiomatic & Professional Register', 'Register Switching in Clinical Settings', 'Recognize and use appropriate professional register, adjusting tone between colleagues and patients.',
 '[{"en":"on the mend","definition":"Recovering well (informal, used with patients/families)","context":"Informal patient update"},{"en":"stable but guarded","definition":"A formal clinical phrase meaning stable but with some risk of decline","context":"Formal clinical register"},{"en":"a rocky recovery","definition":"A recovery with complications or setbacks (informal)","context":"Informal patient update"},{"en":"touch and go","definition":"A critical, uncertain situation (informal idiom)","context":"Informal discussion among colleagues"},{"en":"register","definition":"The level of formality used in language depending on context","context":"Professional communication"}]'::jsonb,
 '{"topic":"Register Switching","explanation":"Professional healthcare English requires switching between formal register (with colleagues, in documentation) and warmer, informal register (with patients and families) — both convey the same information differently.","examples":["Formal: ''The patient''s condition is stable but guarded.'' Informal: ''She''s doing okay, but we''re keeping a close eye on her.''","Formal: ''Recovery has been complicated by post-operative infection.'' Informal: ''It''s been a bit of a rocky recovery.''"]}'::jsonb,
 '{"listening":{"script":"To the family: Good news — he''s on the mend and should be home by the weekend. To a colleague: It was touch and go for the first 48 hours, but he''s stabilized now.","questions":[{"q":"Which phrase is used with the colleague, not the family?","options":["On the mend","Touch and go","Home by the weekend"],"correct":1}]},"quiz":[{"q":"''On the mend'' is an example of:","options":["Formal clinical register","Informal, warm register","Technical jargon"],"correct":1},{"q":"''Touch and go'' means:","options":["A routine situation","A critical, uncertain situation","A scheduled appointment"],"correct":1}]}'::jsonb,
 false, 30),

('C1', 4, 'Checkpoint: Advanced Clinical Communication', 'Evaluación: Razonamiento clínico, persuasión y registro', 'Review hedging language, emphatic structures, and professional register.',
 '[]'::jsonb,
 '{"topic":"Review","explanation":"Review of lessons 1-3","examples":[]}'::jsonb,
 '{"is_checkpoint":true,"review_lessons":[1,2,3],"passing_score":75,"questions":[{"q":"''Rule out'' means to:","options":["Confirm a diagnosis","Eliminate a possibility","Schedule a test"],"correct":1},{"q":"''It is imperative that'' expresses:","options":["A suggestion","Something essential/urgent","A minor preference"],"correct":1},{"q":"''Touch and go'' means:","options":["A routine situation","A critical, uncertain situation","A scheduled appointment"],"correct":1},{"q":"''Presumptive'' means:","options":["Confirmed with certainty","Assumed based on evidence, not confirmed","Completely unknown"],"correct":1},{"q":"''Advocate for'' means to:","options":["Argue against someone","Support someone''s needs","Ignore a situation"],"correct":1}]}'::jsonb,
 true, 35),

('C1', 5, 'Cross-Cultural Communication & Ethical Discussions', 'Diplomatic Disagreement and Ethical Nuance', 'Navigate disagreement and ethical discussions diplomatically in a multicultural healthcare setting.',
 '[{"en":"with all due respect","definition":"A polite phrase used to introduce respectful disagreement","context":"Diplomatic disagreement"},{"en":"I see your point, but","definition":"A phrase acknowledging another view before disagreeing","context":"Diplomatic disagreement"},{"en":"cultural sensitivity","definition":"Awareness and respect for cultural differences in care","context":"Cross-cultural care"},{"en":"informed consent","definition":"A patient''s agreement to treatment based on full understanding of risks","context":"Medical ethics"},{"en":"autonomy","definition":"A patient''s right to make their own healthcare decisions","context":"Medical ethics"}]'::jsonb,
 '{"topic":"Diplomatic Language for Disagreement","explanation":"Use softened disagreement structures to maintain professionalism: ''I see your point, but...'', ''With all due respect, I would suggest...'', ''While I understand your perspective, I''m concerned that...''","examples":["I see your point, but I think we should consider the family''s wishes.","With all due respect, I''d like to propose an alternative approach.","While I understand your perspective, patient autonomy is a key concern here.","I hear what you''re saying, but I have some reservations."]}'::jsonb,
 '{"listening":{"script":"I see your point about the treatment timeline, but with all due respect, I think we need to prioritize the patient''s informed consent here. While I understand your perspective, respecting her autonomy is essential given her cultural background and personal wishes.","questions":[{"q":"What is the main ethical concern discussed?","options":["Cost of treatment","Patient autonomy and informed consent","Hospital scheduling"],"correct":1}]},"quiz":[{"q":"''With all due respect'' is used to:","options":["Insult someone","Introduce respectful disagreement","End a conversation"],"correct":1},{"q":"''Autonomy'' refers to:","options":["A patient''s right to decide","A hospital policy","A type of medication"],"correct":0}]}'::jsonb,
 false, 30);

-- ============================================================
-- SEED DATA: Example Students (Profiles created via auth,
-- run these inserts after creating users via Supabase Auth UI)
-- ============================================================
-- Note: Create users via Supabase Auth first, then update profiles:
-- UPDATE profiles SET
--   country = 'Mexico', phone = '+52 555 123 4567', profession = 'Enfermera',
--   license_number = 'ENF-2023-001', experience_years = 5,
--   exam_interest = 'ielts_academic', current_level = 'A2',
--   validation_status = 'pending', streak = 12, total_xp = 2450
-- WHERE email = 'maria.garcia@example.com';
--
-- UPDATE profiles SET
--   country = 'Colombia', phone = '+57 300 987 6543', profession = 'Enfermera',
--   license_number = 'ENF-2022-089', experience_years = 3,
--   exam_interest = 'pte_academic', current_level = 'B1',
--   validation_status = 'approved', streak = 28, total_xp = 8900
-- WHERE email = 'carlos.lopez@example.com';
--
-- UPDATE profiles SET
--   country = 'Philippines', phone = '+63 912 345 6789', profession = 'Fisioterapeuta',
--   license_number = 'PT-2021-056', experience_years = 7,
--   exam_interest = 'toefl_ibt', current_level = 'A0',
--   validation_status = 'pending', streak = 3, total_xp = 340
-- WHERE email = 'juan.delacruz@example.com';
