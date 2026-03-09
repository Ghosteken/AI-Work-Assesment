CREATE TABLE IF NOT EXISTS briefings (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    ticker VARCHAR(10) NOT NULL,
    sector VARCHAR(255),
    analyst_name VARCHAR(255),
    summary TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    is_generated BOOLEAN NOT NULL DEFAULT FALSE,
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS briefing_points (
    id SERIAL PRIMARY KEY,
    briefing_id INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS briefing_risks (
    id SERIAL PRIMARY KEY,
    briefing_id INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS briefing_metrics (
    id SERIAL PRIMARY KEY,
    briefing_id INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(briefing_id, name)
);

CREATE INDEX idx_briefing_points_briefing_id ON briefing_points(briefing_id);
CREATE INDEX idx_briefing_risks_briefing_id ON briefing_risks(briefing_id);
CREATE INDEX idx_briefing_metrics_briefing_id ON briefing_metrics(briefing_id);
