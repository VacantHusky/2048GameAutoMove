class Config:
    DEBUG = False
    TESTING = False
    # mysql+pymysql://user:password@host:port/database
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:@localhost:3306/myblog'


class DevelopmentConfig(Config):
    DEBUG = True
    ENV = 'development'


class ProductionConfig(Config):
    DATABASE_URI = ''


class TestingConfig(Config):
    TESTING = True
