from pathlib import Path

env_path = Path(__file__).resolve().parents[2] / ".env"
print("Looking for .env at parents[2]:", env_path)
print("Exists:", env_path.exists())

# env_path = Path(__file__).resolve().parents[3] / ".env"
env_path = Path(__file__).resolve().parents[2] / ".env"
print("Looking for .env at parents[3]:", env_path)
print("Exists:", env_path.exists())

env_path = Path(__file__).resolve().parents[4] / ".env"
print("Looking for .env at parents[4]:", env_path)
print("Exists:", env_path.exists())

env_path = Path(__file__).resolve().parents[5] / ".env"
print("Looking for .env at parents[5]:", env_path)
print("Exists:", env_path.exists())