from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from config import settings

database_url = settings.DATABASE_URL

connect_args = {}
if database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    connect_args["timeout"] = 60  # Wait up to 60s for file locks to clear

engine = create_engine(
    database_url,
    connect_args=connect_args,
    pool_pre_ping=True,
    echo=False
)

# Enable WAL mode and busy timeout for concurrent SQLite access across workers
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if database_url.startswith("sqlite"):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA busy_timeout=60000")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.close()
        except Exception:
            pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
