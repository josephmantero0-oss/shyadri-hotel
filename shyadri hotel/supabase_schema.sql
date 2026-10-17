-- ==============================================================================
-- HOTEL SHYADRI - SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Run this entire script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- It creates the orders table, enables Realtime subscriptions, and sets up RLS policies.
-- ==============================================================================

-- 1. Create the orders table
CREATE TABLE IF NOT EXISTS public.hotel_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code TEXT NOT NULL,
    room_number TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    guest_phone TEXT DEFAULT '',
    order_type TEXT NOT NULL DEFAULT 'food', -- 'food', 'toiletries', 'custom', 'mixed'
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    extra_note TEXT DEFAULT '',
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'received', -- 'received', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled'
    staff_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- 2. Create index for fast lookups by room number and status
CREATE INDEX IF NOT EXISTS idx_hotel_orders_room ON public.hotel_orders(room_number);
CREATE INDEX IF NOT EXISTS idx_hotel_orders_status ON public.hotel_orders(status);
CREATE INDEX IF NOT EXISTS idx_hotel_orders_created_at ON public.hotel_orders(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.hotel_orders ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies allowing guests & staff to operate using the Supabase anon key
-- Allow anyone to place an order
CREATE POLICY "Allow public to insert orders"
    ON public.hotel_orders
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow anyone to view orders (privacy of names/notes on public track page is filtered at application level)
CREATE POLICY "Allow public to read orders"
    ON public.hotel_orders
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow staff to update order status (accept, complete, cancel)
CREATE POLICY "Allow public to update orders"
    ON public.hotel_orders
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Enable Supabase Realtime for hotel_orders table
-- This allows instant live updates on the Kitchen Dashboard, Staff Dashboard, and Guest Track Page!
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'hotel_orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.hotel_orders;
    END IF;
END $$;

-- 6. Insert sample orders for testing (optional)
INSERT INTO public.hotel_orders (order_code, room_number, guest_name, order_type, items, extra_note, total_price, status)
VALUES 
    ('ORD-101', '102', 'Amit Sharma', 'food', '[{"n":"Misal Pav","p":"90","qty":2},{"n":"Masala Chai","p":"20","qty":2}]'::jsonb, 'Extra pav please', 220.00, 'received'),
    ('ORD-102', '204', 'Pooja Kulkarni', 'toiletries', '[{"n":"Fresh Bath Towels","p":"0","qty":2},{"n":"Dental Kit","p":"0","qty":1}]'::jsonb, 'Deliver after 12 PM', 0.00, 'accepted'),
    ('ORD-103', '305', 'Rajesh Deshmukh', 'food', '[{"n":"Veg Thali","p":"180","qty":1},{"n":"Solkadhi","p":"50","qty":1}]'::jsonb, 'Less spicy', 230.00, 'preparing')
ON CONFLICT DO NOTHING;

-- Schema setup complete!
