CREATE TYPE user_role AS ENUM ('client', 'barber', 'admin');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'client',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES users(id),
    barber_id INT NOT NULL REFERENCES users(id),
    starts_at TIMESTAMPTZ NOT NULL,
    status appointment_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- A barber can't have two active appointments at the same time,
-- but a cancelled slot can be booked again
CREATE UNIQUE INDEX one_active_appointment_per_slot ON appointments (barber_id, starts_at)
WHERE status <> 'cancelled';
-- Days/hours when booking is not allowed (rest, vacations).
-- barber_id NULL means the whole shop is closed.
CREATE TABLE blocked_slots (
    id SERIAL PRIMARY KEY,
    barber_id INT REFERENCES users(id),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    reason TEXT,
    CHECK (ends_at > starts_at)
);
CREATE TABLE offers (
    id SERIAL PRIMARY KEY,
    image_url TEXT NOT NULL,
    title TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);