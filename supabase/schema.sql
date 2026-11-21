-- ==============================================================================
-- NursePay Check: Supabase PostgreSQL Schema
-- ==============================================================================

-- 1. Table: user_settings
CREATE TABLE IF NOT EXISTS public.user_settings (
    line_user_id VARCHAR PRIMARY KEY,
    display_name VARCHAR NOT NULL DEFAULT 'พยาบาล',
    cutoff_start_day INT NOT NULL DEFAULT 21 CHECK (cutoff_start_day BETWEEN 1 AND 31),
    payout_month_offset INT NOT NULL DEFAULT 1 CHECK (payout_month_offset IN (0, 1)),
    include_base_salary BOOLEAN NOT NULL DEFAULT false,
    base_salary NUMERIC(10, 2) NOT NULL DEFAULT 24500.00,
    default_rates JSONB NOT NULL DEFAULT '{
        "m": 0,
        "a": 300,
        "n": 360,
        "ot_m": 750,
        "ot_a": 750,
        "ot_n": 800,
        "holiday": 300,
        "ot_hr": 120
    }'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Table: extra_presets
CREATE TABLE IF NOT EXISTS public.extra_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_user_id VARCHAR NOT NULL REFERENCES public.user_settings(line_user_id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    default_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payout_channel VARCHAR NOT NULL DEFAULT 'DIRECT' CHECK (payout_channel IN ('HOSPITAL', 'DIRECT')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Table: pay_periods
CREATE TABLE IF NOT EXISTS public.pay_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_user_id VARCHAR NOT NULL REFERENCES public.user_settings(line_user_id) ON DELETE CASCADE,
    period_key VARCHAR NOT NULL, -- e.g. '2026-11'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rates_snapshot JSONB NOT NULL,
    shift_counts JSONB NOT NULL DEFAULT '{
        "m": 0,
        "a": 0,
        "n": 0,
        "ot_m": 0,
        "ot_a": 0,
        "ot_n": 0,
        "holiday": 0
    }'::jsonb,
    actual_slip_amount NUMERIC(10, 2),
    reconcile_status VARCHAR NOT NULL DEFAULT 'PENDING' CHECK (reconcile_status IN ('PENDING', 'MATCHED', 'DISCREPANCY', 'OVERPAID', 'RESOLVED')),
    reconcile_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_period UNIQUE(line_user_id, period_key)
);

-- 4. Table: extra_logs
CREATE TABLE IF NOT EXISTS public.extra_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES public.pay_periods(id) ON DELETE CASCADE,
    line_user_id VARCHAR NOT NULL REFERENCES public.user_settings(line_user_id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    log_type VARCHAR NOT NULL CHECK (log_type IN ('OT_HOURLY', 'COVER_PEER', 'EXTERNAL_CLINIC', 'SELL_SHIFT')),
    title_note VARCHAR NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payout_channel VARCHAR NOT NULL DEFAULT 'DIRECT' CHECK (payout_channel IN ('HOSPITAL', 'DIRECT')),
    is_paid BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pay_periods_user ON public.pay_periods(line_user_id);
CREATE INDEX IF NOT EXISTS idx_pay_periods_key ON public.pay_periods(period_key);
CREATE INDEX IF NOT EXISTS idx_extra_logs_period ON public.extra_logs(period_id);
CREATE INDEX IF NOT EXISTS idx_extra_logs_user ON public.extra_logs(line_user_id);
CREATE INDEX IF NOT EXISTS idx_extra_presets_user ON public.extra_presets(line_user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pay_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_logs ENABLE ROW LEVEL SECURITY;

-- Sample RLS Policies (Allows authenticated/matching LINE users)
CREATE POLICY "Users can manage their own settings" ON public.user_settings
    FOR ALL USING (line_user_id = auth.uid()::text OR auth.role() = 'anon');

CREATE POLICY "Users can manage their own presets" ON public.extra_presets
    FOR ALL USING (line_user_id = auth.uid()::text OR auth.role() = 'anon');

CREATE POLICY "Users can manage their own pay periods" ON public.pay_periods
    FOR ALL USING (line_user_id = auth.uid()::text OR auth.role() = 'anon');

CREATE POLICY "Users can manage their own extra logs" ON public.extra_logs
    FOR ALL USING (line_user_id = auth.uid()::text OR auth.role() = 'anon');
