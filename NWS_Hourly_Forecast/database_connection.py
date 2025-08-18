import sys
import mariadb
import pymysql
from sqlalchemy import create_engine
import mysql.connector as mariadb
import configparser
from pathlib import Path
from urllib.parse import quote_plus


def get_db_config():
    conf_filename = 'cred.conf'
    config_file = Path(conf_filename)
    if not config_file.exists():
        print("No config")
        sys.exit(1)
    try:
        config = configparser.ConfigParser()
        config.read_file(config_file.open())
    except:
        print(
            f"_import_config; Error parsing configuration file {conf_filename}. Please refer to the sample configuration {conf_filename}-SAMPLE"
        )
        sys.exit(1)

    if not config.has_section("Database"):
        print(
            f"_import_config; Invalid Configuration file. Missing Database Configurations. Please refer to the sample configuration {conf_filename}-SAMPLE"
        )
        sys.exit(1)
    db_config = {"connect_timeout": 30,}
    db_config["user"] = config.get("Database", "db_username")
    db_config["password"] = config.get("Database", "db_password")
    db_config["host"] = config.get("Database", "db_host", fallback='localhost')
    db_config["port"] = config.getint("Database", "db_port", fallback=3306)
    db_config["database"] = config.get("Database", "db_database")
    db_config["autocommit"] = True
    return db_config

def setup_connection(db_config):
    try:
        db_connection = mariadb.connect(**db_config)
        return db_connection
    except mariadb.Error as e:
        raise mariadb.Error(e)

def setup_db_connection_pandas(db_config):
    # print(db_config["host"])
    conn_str = 'mysql://{0}:{1}@{2}:{3}/{4}'.format(db_config["user"], quote_plus(db_config["password"]), db_config["host"], db_config["port"], db_config["database"])
    # print(conn_str)
    engine = create_engine(conn_str)
    # db_connection = pymysql.connect(**db_config)
    return engine

def tear_down_connection(db_connection):
    db_connection.close()