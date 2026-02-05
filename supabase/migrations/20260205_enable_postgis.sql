-- Enable PostGIS Extension (Essential for Spatial Queries)
create extension if not exists postgis;

-- Create the Protected Zones Table
create table if not exists public.protected_zones (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    law text not null,
    article text,
    section text not null,
    severity text check (severity in ('CRITICAL', 'HIGH', 'INFO')),
    zone_type text default 'Restricted',
    geometry geometry(Polygon, 4326) not null, -- Stores the shape in WGS84 (Lat/Lon)
    created_at timestamptz default now()
);

-- Create a Spatial Index (The R-Tree) for lightning-fast queries
create index if not exists protected_zones_geo_idx on public.protected_zones using gist (geometry);

-- Insert Sample Data (Converting our JSON to SQL)
-- 1. Yamuna Floodplains
insert into public.protected_zones (name, law, article, section, severity, geometry)
values (
    'Yamuna Floodplains',
    'Environment Protection Act, 1986',
    'Article 21 (Right to Clean Environment)',
    'Section 3(2)(v) - Restriction of Industries & Construction',
    'CRITICAL',
    ST_GeomFromGeoJSON('{
        "type": "Polygon",
        "coordinates": [[
            [77.24, 28.58], [77.35, 28.58], [77.35, 28.68], [77.24, 28.68], [77.24, 28.58]
        ]]
    }')
);

-- 2. Aravalli Ridge
insert into public.protected_zones (name, law, article, section, severity, geometry)
values (
    'Aravalli Ridge',
    'Forest (Conservation) Act, 1980',
    'SC Ruling on Aravalli Mining (2002)',
    'Section 2 - Restriction on the dereservation of forests',
    'CRITICAL',
    ST_GeomFromGeoJSON('{
        "type": "Polygon",
        "coordinates": [[
            [77.12, 28.53], [77.16, 28.53], [77.16, 28.57], [77.12, 28.57], [77.12, 28.53]
        ]]
    }')
);

-- 3. UP Industrial Green Belt
insert into public.protected_zones (name, law, article, section, severity, geometry)
values (
    'Industrial Green Belt (UP)',
    'UP Urban Planning & Development Act, 1973',
    'Section 13',
    'Section 13 - Restriction on land use',
    'HIGH',
    ST_GeomFromGeoJSON('{
        "type": "Polygon",
        "coordinates": [[
            [77.38, 28.45], [77.50, 28.45], [77.50, 28.55], [77.38, 28.55], [77.38, 28.45]
        ]]
    }')
);

-- Remote Procedure Call (RPC) for Clients
-- Instead of downloading all polygons to the frontend, we send the point to the DB
create or replace function check_geo_compliance(lat double precision, lng double precision)
returns table (
    is_violation boolean,
    zone_name text,
    law text,
    section text,
    severity text,
    jurisdiction text
) as $$
declare
    target_point geometry;
begin
    target_point := ST_SetSRID(ST_MakePoint(lng, lat), 4326);

    return query
    select 
        true as is_violation,
        pz.name as zone_name,
        pz.law,
        pz.section,
        pz.severity,
        'Supreme Court of India' as jurisdiction -- Placeholder logic
    from public.protected_zones pz
    where ST_Intersects(pz.geometry, target_point) -- Precise Intersection
    limit 1;
    
    if not found then
        return query select 
            false, 'Unregulated Zone'::text, 'N/A'::text, 'N/A'::text, 'INFO'::text, 'N/A'::text;
    end if;
end;
$$ language plpgsql;
