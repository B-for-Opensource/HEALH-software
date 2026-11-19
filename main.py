import sys
import importlib.util
from pathlib import Path

# Add Backend-python directory to sys.path so its internal imports (models, database, etc.) work
backend_dir = Path(__file__).resolve().parent / "Backend-python"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Load FastAPI app from Backend-python/main.py
backend_main_path = backend_dir / "main.py"
spec = importlib.util.spec_from_file_location("backend_main_module", backend_main_path)
if spec is None or spec.loader is None:
    raise ImportError(f"Cannot load backend main from {backend_main_path}")

backend_module = importlib.util.module_from_spec(spec)
sys.modules["backend_main_module"] = backend_module
spec.loader.exec_module(backend_module)

app = backend_module.app
