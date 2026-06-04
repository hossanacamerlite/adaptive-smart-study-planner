from dotenv import load_dotenv
import os
import mysql.connector
from mysql.connector import pooling, errors

try:
    # Flask is only needed for request-scoped connection management.
    from flask import g
    from werkzeug.local import LocalProxy
except Exception:  # pragma: no cover
    g = None
    LocalProxy = None

load_dotenv("../assp-frontend/.env")

_POOL = None


def _db_config():
    return {
        "host": os.getenv("DATABASE_HOST"),
        "user": os.getenv("DATABASE_USER"),
        "password": os.getenv("DATABASE_PASSWORD"),
        "database": os.getenv("DATABASE_NAME"),
        # Prevent hanging forever and reduce idle disconnect pain.
        "connection_timeout": int(os.getenv("DATABASE_CONNECTION_TIMEOUT", "10")),
        "autocommit": False,
        "use_pure": False,
    }


def _get_pool() -> pooling.MySQLConnectionPool:
    global _POOL
    if _POOL is None:
        _POOL = pooling.MySQLConnectionPool(
            pool_name=os.getenv("DATABASE_POOL_NAME", "assp_pool"),
            pool_size=int(os.getenv("DATABASE_POOL_SIZE", "8")),
            pool_reset_session=True,
            **_db_config(),
        )
    return _POOL


_TRANSIENT_ERRNOS = {2006, 2013, 2055}  # server gone away / lost connection / lost connection system error


class ResilientConnection:
    def __init__(self, cnx):
        self._cnx = cnx

    def ping(self, *args, **kwargs):
        return self._cnx.ping(*args, **kwargs)

    def commit(self):
        return self._cnx.commit()

    def rollback(self):
        return self._cnx.rollback()

    def close(self):
        return self._cnx.close()

    def is_connected(self):
        return self._cnx.is_connected()

    def reconnect(self, *args, **kwargs):
        return self._cnx.reconnect(*args, **kwargs)

    def cursor(self, *args, **kwargs):
        # Ensure caller gets a resilient cursor wrapper too.
        return ResilientCursor(self, self._cnx.cursor(*args, **kwargs))


class ResilientCursor:
    def __init__(self, rconn: ResilientConnection, cur):
        self._rconn = rconn
        self._cur = cur

    def _ensure_alive(self):
        # `reconnect=True` handles stale/idle connections cleanly.
        try:
            self._rconn.ping(reconnect=True, attempts=2, delay=1)
        except Exception:
            # If ping fails, we still try the query and let execute() handle retry.
            pass

    def _execute_compat(self, operation, params=None, multi=False):
        if multi:
            # Prefer positional multi if supported, else fall back to normal execute.
            try:
                return self._cur.execute(operation, params, True)
            except TypeError:
                return self._cur.execute(operation, params)

        # Non-multi is the common path; avoid passing unexpected kwargs.
        return self._cur.execute(operation, params)

    def execute(self, operation, params=None, multi=False):
        self._ensure_alive()
        try:
            return self._execute_compat(operation, params=params, multi=multi)
        except errors.OperationalError as e:
            errno = getattr(e, "errno", None)
            if errno not in _TRANSIENT_ERRNOS:
                raise

            # One reconnect + retry for transient disconnects.
            try:
                self._rconn.reconnect(attempts=2, delay=1)
            except Exception:
                # If reconnect fails, swap to a fresh pooled connection.
                fresh = _get_pool().get_connection()
                self._rconn._cnx = fresh

            try:
                self._cur.close()
            except Exception:
                pass
            self._cur = self._rconn._cnx.cursor(dictionary=True)
            return self._execute_compat(operation, params=params, multi=multi)

    def executemany(self, operation, seq_params):
        self._ensure_alive()
        try:
            return self._cur.executemany(operation, seq_params)
        except errors.OperationalError as e:
            errno = getattr(e, "errno", None)
            if errno not in _TRANSIENT_ERRNOS:
                raise
            self._rconn.reconnect(attempts=2, delay=1)
            try:
                self._cur.close()
            except Exception:
                pass
            self._cur = self._rconn._cnx.cursor(dictionary=True)
            return self._cur.executemany(operation, seq_params)

    def fetchone(self):
        return self._cur.fetchone()

    def fetchall(self):
        return self._cur.fetchall()

    @property
    def lastrowid(self):
        return self._cur.lastrowid

    def close(self):
        return self._cur.close()

    def __getattr__(self, name):
        # Delegate everything else to the real cursor.
        return getattr(self._cur, name)


def _get_db():
    if g is None:
        # Non-Flask context: just return a fresh pooled connection wrapper.
        return ResilientConnection(_get_pool().get_connection())

    if "db" not in g:
        g.db = ResilientConnection(_get_pool().get_connection())
    return g.db


def _get_cursor():
    if g is None:
        return _get_db().cursor(dictionary=True)

    if "cursor" not in g:
        g.cursor = _get_db().cursor(dictionary=True)
    return g.cursor


def close_db(_err=None):
    if g is None:
        return
    cur = g.pop("cursor", None)
    cnx = g.pop("db", None)
    try:
        if cur is not None:
            cur.close()
    finally:
        if cnx is not None:
            cnx.close()


def init_db(app):
    # Close request-scoped cursor/connection automatically.
    app.teardown_appcontext(close_db)


# Backwards-compatible exports used throughout app.py
db = LocalProxy(_get_db) if LocalProxy is not None else _get_db()
cursor = LocalProxy(_get_cursor) if LocalProxy is not None else _get_cursor()