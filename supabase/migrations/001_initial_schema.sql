-- ============================================================
-- RivalRadar - Initial Schema Migration
-- Supabase Dashboard > SQL Editor > Run this script
-- ============================================================

-- --------------------------------------------------------
-- PROFILES TABLE
-- Supabase auth.users tablosunu extend eder.
-- NEDEN ayrı tablo: auth.users'a doğrudan kolon ekleyemezsiniz.
-- Profiles, her user için 1:1 ilişkiyle ek veri tutar.
-- --------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  credits INTEGER NOT NULL DEFAULT 3, -- Signup'ta 3 ücretsiz rapor
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------
-- REPORTS TABLE
-- Her analiz isteği için bir kayıt.
-- NEDEN JSONB: Rapor yapısı esnek ve değişken. SQL kolon yerine
-- JSONB ile şema değişikliği yapmadan ilerleyebiliriz.
-- --------------------------------------------------------
CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  sector TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  report_data JSONB,
  competitors JSONB,
  swot JSONB,
  market_position JSONB,
  pricing_comparison JSONB,
  recommendations JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- --------------------------------------------------------
-- CREDIT TRANSACTIONS TABLE
-- Kredi hareketleri için audit log.
-- NEDEN ayrı tablo: Kredi bakiyesini profiles.credits'ten okuruz,
-- ama geçmişi burada tutarız. Dispute'larda delil, debug'da yardım.
-- --------------------------------------------------------
CREATE TABLE public.credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- +3 (signup), -1 (report)
  reason TEXT NOT NULL
    CHECK (reason IN ('signup_bonus', 'report_generated', 'admin_grant')),
  report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------
-- INDEXES
-- NEDEN index: user_id ile sık sorgu yapılacak (kullanıcının raporları).
-- Index olmadan full table scan olur, yavaşlar.
-- --------------------------------------------------------
CREATE INDEX idx_reports_user_id ON public.reports(user_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);

-- --------------------------------------------------------
-- UPDATED_AT TRIGGER
-- NEDEN trigger: profiles.updated_at'ı her UPDATE'de otomatik günceller.
-- Uygulama katmanında unutmak riski yok.
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- --------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- NEDEN RLS: Supabase'de tüm tablolar public erişilebilir.
-- RLS olmadan herkes herkese ait veriyi okuyabilir.
-- Bu politikalar sadece kendi verisine erişim sağlar.
-- --------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Reports policies
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
  ON public.reports FOR UPDATE
  USING (auth.uid() = user_id);

-- Credit transactions policies
CREATE POLICY "Users can view own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- --------------------------------------------------------
-- SERVICE ROLE BYPASS
-- NEDEN: Next.js API routes'tan Supabase service_role key ile
-- yapılan işlemler (kredi güncelleme, rapor yazma) RLS'yi bypass eder.
-- Ama biz anon key kullanıyoruz, bu yüzden uygulama katmanında
-- user_id check yapıyoruz (double security).
-- --------------------------------------------------------
