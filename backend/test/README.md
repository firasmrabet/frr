verify-update-product.mjs

This script helps you update a row in the `custom_products` table and verifies the change.

Usage (PowerShell):

1) Set environment variables (replace with your values):

$env:SUPABASE_URL = 'https://yourproject.supabase.co'
$env:SUPABASE_SERVICE_KEY = 'service-role-key'

2) Update a single field:

npm run test:verify-update -- --id <product-id> --field price --value 199.99

3) Update multiple fields from a JSON file:

# prepare payload.json, for example:
# { "price": 199.99, "characteristics": { "Puissance": "100kVA" } }
node test/verify-update-product.mjs --id <product-id> --file payload.json

4) Dry run (show payload without performing update):

node test/verify-update-product.mjs --id <product-id> --file payload.json --dry-run

Exit codes:
0: success (field(s) changed)
non-zero: failure (see console output)

Notes:
- Use the service role key for server-side updates when RLS restricts updates.
- The script prints before/after rows for manual inspection.
