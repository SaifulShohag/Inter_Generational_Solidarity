"""Shared slowapi rate-limiter — import in both main.py and any router that needs limiting."""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
