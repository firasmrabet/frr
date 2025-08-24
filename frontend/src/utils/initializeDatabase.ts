import { supabase } from '../supabaseClient';

// Function to initialize the database tables
export const initializeDatabase = async () => {
  try {
    console.log('Initializing database tables...');

    // Create custom_categories table
    const { error: categoriesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS custom_categories (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          image TEXT,
          characteristics JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (categoriesError) {
      console.log('Categories table might already exist or error:', categoriesError);
    }

    // Create custom_products table
    const { error: productsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS custom_products (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL DEFAULT 0,
          image TEXT,
          category_id UUID REFERENCES custom_categories(id) ON DELETE CASCADE,
          characteristics JSONB DEFAULT '{}'::jsonb,
          variations JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (productsError) {
      console.log('Products table might already exist or error:', productsError);
    }

    // Enable RLS
  await supabase.rpc('exec_sql', { sql: 'ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;' });
  await supabase.rpc('exec_sql', { sql: 'ALTER TABLE custom_products ENABLE ROW LEVEL SECURITY;' });

  // Create policies
  await supabase.rpc('exec_sql', { sql: `CREATE POLICY IF NOT EXISTS "Public can read categories" ON custom_categories FOR SELECT USING (true);` });
  await supabase.rpc('exec_sql', { sql: `CREATE POLICY IF NOT EXISTS "Admin can manage categories" ON custom_categories FOR ALL USING ((auth.jwt() ->> 'email' = 'firassmrabett111@gmail.com' OR auth.jwt() ->> 'email' = 'marwenyoussef2017@gmail.com'));` });
  await supabase.rpc('exec_sql', { sql: `CREATE POLICY IF NOT EXISTS "Public can read products" ON custom_products FOR SELECT USING (true);` });
  await supabase.rpc('exec_sql', { sql: `CREATE POLICY IF NOT EXISTS "Admin can manage products" ON custom_products FOR ALL USING ((auth.jwt() ->> 'email' = 'firassmrabett111@gmail.com' OR auth.jwt() ->> 'email' = 'marwenyoussef2017@gmail.com'));` });

    console.log('Database initialization completed!');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
};

// Alternative method using direct SQL execution
export const createTablesDirectly = async () => {
  try {
    // Check if tables exist by trying to select from them
    const { error: checkCategoriesError } = await supabase
      .from('custom_categories')
      .select('id')
      .limit(1);

  await supabase.from('custom_products').select('id').limit(1);

    if (checkCategoriesError && checkCategoriesError.code === 'PGRST116') {
      console.log('Tables do not exist. Please run the SQL migration script in Supabase dashboard.');
      return false;
    }

    console.log('Tables already exist and are accessible.');
    return true;
  } catch (error) {
    console.error('Error checking tables:', error);
    return false;
  }
};
