import os
import shutil
import glob
import subprocess
import sys
from PIL import Image
from datetime import datetime

sys.path.append('../')  # allows importing from the module this file is in
from yoloGUI import yolo_settings as settings
from yoloGUI import yolo_redmine as yolo_redmine


BASE_PATH = settings.IMAGES_ROOT
BASE_URL = settings.BASE_URL

IMG_SRC_PATH = os.path.join(BASE_PATH, "darkflow_images_src")
IMG_WRK_PATH = os.path.join(BASE_PATH, "darkflow_images_wrk")
IMG_DST_PATH = os.path.join(BASE_PATH, "darkflow_images_dst")

IMG_BATCH_SIZE = 10
IMG_FORMATS = [".jpg", ".JPG", ".jpeg", ".JPEG", ".png", ".PNG"]
IMG_THUMB_SIZE = [100, 150]
IMG_WORK_SIZE = [1024, 768]

DARKFLOW_PATH = "/home/yolo/PycharmProjects/darkflow"
DARKFLOW_CFG = "/cfg/tiny-yolo-voc.cfg"
DARKFLOW_WEIGHTS = "/bin/tiny-yolo-voc.weights"
DARKFLOW_THRESHOLD = "0.25"


def start():
    """
    1. copy all files from source folder to work folder.
    2. run darkflow on the work folder (creates json annotation files)
    3. create a "work" copy and "thumb" copy for each image.
    4. move images by batches into separate folders.
    5. create redmine issue for each batch folder.
    6. remove all files from source folder.
    """
    # check the most recent file and check for 20-second time difference
    # to ensure that file transfer process of images has completed
    src_files = glob.glob(IMG_SRC_PATH + '/*')  # * means all, if need specific format then *.csv
    if src_files.__len__() == 0:
        print("the images folder is empty.")
        return

    while True:
        latest_file = max(src_files, key=os.path.getmtime)
        time_file = os.path.getmtime(latest_file)
        time_now = datetime.now().timestamp()

        if time_now - time_file > 20:
            break

    # 1. copy the images from the source folder to the work folder
    src_files = os.listdir(IMG_SRC_PATH)
    for file in src_files:
        file_ext = os.path.splitext(file)[1]
        if file_ext in IMG_FORMATS:
            shutil.copy2(os.path.join(IMG_SRC_PATH, file), IMG_WRK_PATH)
        else:
            print("Invalid file format: " + file)

    # store list of original images BEFORE generating more files
    work_files = os.listdir(IMG_WRK_PATH)

    # 2. run yolo on the images to produce json data files (no images)
    subprocess.run([DARKFLOW_PATH + "/flow",
                          "--imgdir", IMG_WRK_PATH,
                          "--model", DARKFLOW_PATH + DARKFLOW_CFG,
                          "--load", DARKFLOW_PATH + DARKFLOW_WEIGHTS,
                          "--threshold", DARKFLOW_THRESHOLD,
                          "--json"], stdout=subprocess.PIPE)

    # 3. generate thumbnail and workspace versions of the images
    for file in work_files:
        file_ext = os.path.splitext(file)[1]
        file_path = os.path.join(IMG_WRK_PATH, file)
        if file_ext in IMG_FORMATS:
            try:
                img = Image.open(file_path)
                img.thumbnail(IMG_THUMB_SIZE, Image.ANTIALIAS)
                thumb_file = os.path.splitext(file_path)[0] + "_thumb" + file_ext
                img.save(thumb_file, "JPEG")

                img = Image.open(file_path)
                img.thumbnail(IMG_WORK_SIZE, Image.ANTIALIAS)
                work_file = os.path.splitext(file_path)[0] + "_work" + file_ext
                img.save(work_file, "JPEG")

            except IOError as e:
                print("cannot create thumbnail/work images for '%s'" % file)
                print(e)

    # 4. create batches of images in folders named after timestamp
    counter = 0
    dir_name = ""
    for file in work_files:
        # create new directory for every batch of images
        if counter % IMG_BATCH_SIZE == 0:
            ts = str(datetime.now().timestamp()).replace(".", "-")
            dir_name = os.path.join(IMG_DST_PATH, ts)
            os.mkdir(dir_name)
            # 5. create gTrack issue for this batch
            yolo_redmine.create_issue(dir_name)

        file_name = os.path.splitext(file)[0]
        file_ext = os.path.splitext(file)[1]
        # move the image and its associated files to the batch directory
        os.rename(os.path.join(IMG_WRK_PATH, file),
                  os.path.join(dir_name, file_name + "_original" + file_ext))
        os.rename(os.path.join(IMG_WRK_PATH, file_name + "_work" + file_ext),
                  os.path.join(dir_name, file_name + "_work" + file_ext))
        os.rename(os.path.join(IMG_WRK_PATH, file_name + "_thumb" + file_ext),
                  os.path.join(dir_name, file_name + "_thumb" + file_ext))
        os.rename(os.path.join(IMG_WRK_PATH, file_name + ".json"),
                  os.path.join(dir_name, file_name + ".json"))
        counter += 1

    # 6. finally, remove the list of files from the source folder
    for file in src_files:
        file_path = os.path.join(IMG_SRC_PATH, file)
        os.remove(file_path)


def cleanup():
    """
    removes all files in the work directory.
    """
    for file in os.listdir(IMG_WRK_PATH):
        os.remove(file)


try:
    start()
except (ConnectionError, FileNotFoundError, ValueError) as e:
    cleanup()
    print("An exception occurred: " + str(e))
