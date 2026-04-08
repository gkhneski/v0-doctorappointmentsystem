-- Add payment fields to appointments table
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'pending')),
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10, 2) DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN public.appointments.payment_status IS 'Payment status: paid, unpaid, or pending';
COMMENT ON COLUMN public.appointments.payment_amount IS 'Payment amount in Turkish Lira';
