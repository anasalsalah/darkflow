import os

# "/home/yolo/PycharmProjects/darkflow/yoloGUI/"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_URL = "http://192.168.0.63:8000"

STATIC_ROOT = os.path.join(BASE_DIR, "resources")
STATIC_URL = '/resources/'
IMAGES_ROOT = os.path.join(BASE_DIR, "images")
MEDIA_ROOT = os.path.join(IMAGES_ROOT, "darkflow_images_dst")
MEDIA_URL = '/images/'
