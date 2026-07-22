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

-- RLS: Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'case_manager')
    )
  );

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'case_manager')
    )
  );

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
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'case_manager')
    )
  );

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
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'case_manager')
    )
  );

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
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'case_manager')
    )
  );

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
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'case_manager')
    )
  );

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
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'case_manager')
    )
  );

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
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
 '{"topic":"Articles: a/an/the","explanation":"A before consonant, An before vowel, The for specific","examples":["a headache","an arm injury","the patient"}'::jsonb,
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
