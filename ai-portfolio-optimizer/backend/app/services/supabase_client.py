import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

_client: Client | None = None


def get_supabase() -> Client | None:
    """Returns a Supabase client, or None if env vars aren't set (saving is optional)."""
    global _client
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _client
