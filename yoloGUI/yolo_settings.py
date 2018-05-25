import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_URL = "http://192.168.0.63:8000"

STATIC_ROOT = os.path.join(BASE_DIR, "resources")
STATIC_URL = '/resources/'
IMAGES_ROOT = os.path.join(BASE_DIR, "images")
MEDIA_ROOT = os.path.join(IMAGES_ROOT, "darkflow_images_dst")
MEDIA_URL = '/images/'

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s %(name)-12s %(levelname)-8s %(message)s',
        },
    },
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'log', 'yoloGUI.log'),
            'formatter': 'standard',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'standard',
        }
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'DEBUG',
            'propagate': True,
        },
        '': {
            'handlers': ['file', 'console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
