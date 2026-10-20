import sys
import os

# Add the backend root directory to Python path
# When Vercel runs, __file__ is /var/task/api/index.py
# So dirname(dirname()) = /var/task = backend root
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

# Also add current working directory
cwd = os.getcwd()
if cwd not in sys.path:
    sys.path.insert(0, cwd)

from app.main import app
