"""Hermetic test configuration: never use saved merchant/service credentials."""
import os

os.environ.update({
    'DEBUG': 'false',
    'ENVIRONMENT': 'test',
    'SUPABASE_URL': 'https://example.supabase.co',
    'SUPABASE_SECRET_KEY': 'sb_secret_test_only',
    'SUPABASE_SERVICE_ROLE_KEY': '',
    'OPENAI_API_KEY': 'sk-test-only',
    'JWT_SECRET': 'test-only-secret-not-for-production',
    'AI_GATEWAY_TOKEN': '',
})
