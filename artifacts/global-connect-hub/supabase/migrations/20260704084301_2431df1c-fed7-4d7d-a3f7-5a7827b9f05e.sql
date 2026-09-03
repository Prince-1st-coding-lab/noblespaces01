
-- Services catalog (editable by admins)
CREATE TABLE IF NOT EXISTS public.services (
  slug TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  icon TEXT,
  availability TEXT NOT NULL DEFAULT 'service' CHECK (availability IN ('both','custom','service')),
  lead_time_min INTEGER NOT NULL DEFAULT 3,
  lead_time_max INTEGER NOT NULL DEFAULT 14,
  sort_order INTEGER NOT NULL DEFAULT 100,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible services"
  ON public.services FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert services"
  ON public.services FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update services"
  ON public.services FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete services"
  ON public.services FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with current bundled services
INSERT INTO public.services (slug, title, icon, availability, lead_time_min, lead_time_max, sort_order) VALUES
  ('interior-design',              'Interior Design Services',        'Palette',        'service', 3, 14, 10),
  ('wardrobes-manufacturing',      'Wardrobes Manufacturing',         'Shirt',          'custom', 10, 21, 20),
  ('modern-kitchen-installations', 'Modern Kitchen Installations',    'ChefHat',        'custom', 14, 30, 30),
  ('media-tv-wall-installation',   'Media & TV Wall Installation',    'Tv',             'custom',  7, 14, 40),
  ('office-equipment-supply',      'Office Equipment Supply',         'Briefcase',      'both',    2,  7, 50),
  ('fabric-replacement',           'Fabric Replacement',              'Scissors',       'service', 3,  7, 60),
  ('sofa-cleaning',                'Sofa Cleaning',                   'Sparkles',       'service', 1,  3, 70),
  ('curtains-supply-installation', 'Curtains Supply & Installation',  'Blinds',         'both',    5, 14, 80),
  ('soundproof-installation',      'Soundproof Installation',         'Volume2',        'service', 5, 14, 90),
  ('wall-partitioning',            'Wall Partitioning',               'LayoutPanelTop', 'custom',  5, 14,100),
  ('baby-beds-manufacturing',      'Baby Beds Manufacturing',         'Baby',           'both',    7, 14,110),
  ('sofa-manufacturing',           'Sofa Manufacturing',              'Sofa',           'both',   10, 21,120),
  ('ceiling-installation',         'Ceiling Installation',            'PanelTop',       'service', 5, 14,130),
  ('carpet-cleaning',              'Carpet Cleaning',                 'Brush',          'service', 1,  3,140),
  ('pet-houses-manufacturing',     'Pet Houses Manufacturing',        'Dog',            'both',    5, 10,150),
  ('dining-tables-manufacturing',  'Dining Tables Manufacturing',     'Utensils',       'both',   10, 21,160),
  ('console-installation',         'Console Installation',            'Archive',        'custom',  7, 14,170),
  ('carpet-supply-installation',   'Carpet Supply & Installation',    'Layers',         'both',    3, 10,180),
  ('painting-works',               'Painting Works',                  'PaintBucket',    'service', 3, 10,190),
  ('interior-door-manufacturing',  'Interior Door Manufacturing',     'DoorOpen',       'both',    7, 21,200),
  ('exterior-door-manufacturing',  'Exterior Door Manufacturing',     'DoorClosed',     'both',   10, 28,210)
ON CONFLICT (slug) DO NOTHING;
