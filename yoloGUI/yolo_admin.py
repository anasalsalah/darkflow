import os
import shutil
import glob
import subprocess
import traceback
import sys
import django.contrib.auth.hashers as hash

from subprocess import CalledProcessError
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
IMG_TEST_PATH = os.path.join(IMG_DST_PATH, "admin_yolo_test")

# IMG_BATCH_SIZE = 10
IMG_FORMATS = [".jpg", ".JPG", ".jpeg", ".JPEG", ".png", ".PNG"]
IMG_THUMB_SIZE = [100, 150]
IMG_WORK_SIZE = [1024, 768]

DARKFLOW_PATH = "/home/yolo/PycharmProjects/darkflow"
DARKFLOW_CFG = "/cfg/tiny-yolo-voc.cfg"
DARKFLOW_WEIGHTS = "/bin/tiny-yolo-voc.weights"
# DARKFLOW_CONFIDENCE = "0.25"

# Y0L0@dmin!
ADMIN_PASS_HASH = 'pbkdf2_sha256$100000$09hPTzSNSlWb$DAuhxOpgzev8VZLJpv6JHiBFdSYFwOwu0MN5n9Wi21k='


def make_password(password):
    hashed_pass = hash.make_password(password)
    print(hashed_pass)
    return hashed_pass


def check_password(password):
    match = hash.check_password(password, ADMIN_PASS_HASH)
    print(match)
    return match


def process_images(darkflow_confidence=0.25, img_batch_size=25):
    """
    1. copy all files from source folder to work folder.
    2. run darkflow on the work folder (creates json annotation files)
    3. create a "work" copy and "thumb" copy for each image.
    4. move images by batches into separate folders.
    5. create redmine issue for each batch folder.
    6. remove all files from source folder.
    """
    result_message = ""
    try:
        # check if images folder is empty
        src_files = glob.glob(IMG_SRC_PATH + '/*')  # * means all, if need specific format then *.csv
        if src_files.__len__() == 0:
            raise YoloError("ERROR - the images folder is empty.\n")

        # check the most recent file and check for 20-second time difference
        # to ensure that file transfer process of images has completed
        while True:
            latest_file = max(src_files, key=os.path.getmtime)
            time_file = os.path.getmtime(latest_file)
            time_now = datetime.now().timestamp()
            if time_now - time_file > 20:
                break
    except EnvironmentError:
        result_message += "ERROR - could not verify images in source folder: \n%s\n" % traceback.format_exc()
        result_message += cleanup_work_folder()
        raise YoloError(result_message)

    # 1. copy the images from the source folder to the work folder
    try:
        # clean up work folder just in case.
        for file in os.listdir(IMG_WRK_PATH):
            os.remove(os.path.join(IMG_WRK_PATH, file))

        src_files = os.listdir(IMG_SRC_PATH)
        for file in src_files:
            file_ext = os.path.splitext(file)[1]
            if file_ext in IMG_FORMATS:
                shutil.copy2(os.path.join(IMG_SRC_PATH, file), IMG_WRK_PATH)
            else:
                result_message += "WARNING - Invalid file format: %s\n" % file
    except EnvironmentError:
        result_message += "ERROR - could not copy images to work folder:\n%s\n" % traceback.format_exc()
        result_message += cleanup_work_folder()
        raise YoloError(result_message)

    # store list of original images BEFORE generating more files
    work_files = os.listdir(IMG_WRK_PATH)

    # 2. run YOLO on the images to produce json data files
    try:
        subprocess.check_output([DARKFLOW_PATH + "/flow",
                          "--imgdir", IMG_WRK_PATH,
                          "--outdir", IMG_WRK_PATH,
                          "--model", DARKFLOW_PATH + DARKFLOW_CFG,
                          "--load", DARKFLOW_PATH + DARKFLOW_WEIGHTS,
                          "--threshold", str(darkflow_confidence),
                          "--json"], stderr=subprocess.STDOUT)

        result_message += "Darkflow processed images successfully.\n"

    except (EnvironmentError, CalledProcessError):
        result_message += "ERROR - darkflow failed to process images:\n%s\n " % traceback.format_exc()
        result_message += cleanup_work_folder()
        raise YoloError(result_message)

    # 3. generate thumbnail and workspace versions of the images
    try:
        for file in work_files:
            file_ext = os.path.splitext(file)[1]
            file_path = os.path.join(IMG_WRK_PATH, file)
            if file_ext in IMG_FORMATS:
                img = Image.open(file_path)
                img.thumbnail(IMG_THUMB_SIZE, Image.ANTIALIAS)
                thumb_file = os.path.splitext(file_path)[0] + "_thumb" + file_ext
                img.save(thumb_file, "JPEG")

                img = Image.open(file_path)
                img.thumbnail(IMG_WORK_SIZE, Image.ANTIALIAS)
                work_file = os.path.splitext(file_path)[0] + "_work" + file_ext
                img.save(work_file, "JPEG")
            else:
                result_message += "WARNING - Invalid file format for %s\n" % file
    except EnvironmentError:
        result_message += "ERROR - Thumbnail/Work images generation failed for %s\n" % file
        result_message += "The exception was:\n%s\n" % traceback.format_exc()
        result_message += cleanup_work_folder()
        raise YoloError(result_message)

    # 4. create batches of images in folders named after timestamp
    try:
        counter = 0
        dir_name = ""
        issues_list = []
        for file in work_files:
            # create new directory for every batch of images
            if counter % img_batch_size == 0:
                ts = str(datetime.now().timestamp()).replace(".", "-")
                dir_name = os.path.join(IMG_DST_PATH, ts)
                os.mkdir(dir_name)
                # 5. create gTrack issue for this batch
                try:
                    issue_id, redmine_result = yolo_redmine.create_issue(dir_name)
                    issues_list.append(issue_id)
                    result_message += redmine_result
                except ConnectionError:
                    result_message += "ERROR - Could not create Redmine issue for directory %s\n" % dir_name
                    result_message += "The exception was:\n%s\n" % traceback.format_exc()
                    result_message += cleanup_work_folder()
                    result_message += yolo_redmine.delete_issues(issues_list)
                    raise YoloError(result_message)

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
    except EnvironmentError:
        result_message += "ERROR - Could not move files to batch directory for %s\n" % file
        result_message += "The exception was:\n%s\n" % traceback.format_exc()
        result_message += cleanup_work_folder()
        result_message += yolo_redmine.delete_issues(issues_list)
        raise YoloError(result_message)

    # 6. finally, remove the list of files from the source folder
    try:
        for file in src_files:
            file_path = os.path.join(IMG_SRC_PATH, file)
            os.remove(file_path)
    except EnvironmentError:
        result_message += "ERROR - Could not remove file from source folder for %s\n" % file
        result_message += "The exception was:\n%s\n" % traceback.format_exc()
        result_message += cleanup_work_folder()
        result_message += yolo_redmine.delete_issues(issues_list)
        raise YoloError(result_message)

    return "SUCCESS - The job is complete.\n\nThe following messages were returned:\n" + result_message


def cleanup_work_folder():
    """
    removes all files in the work directory.
    """
    try:
        for file in os.listdir(IMG_WRK_PATH):
            os.remove(os.path.join(IMG_WRK_PATH, file))
        return "Cleaned up work folder successfully."
    except EnvironmentError:
        return "ERROR - could not clean up work folder:\n%s\n" % traceback.format_exc()


def test_yolo(image_file, confidence):

    # clean up test images folder
    for file in os.listdir(IMG_TEST_PATH):
        os.remove(os.path.join(IMG_TEST_PATH, file))

    # save image to test folder
    test_image = Image.open(image_file)
    test_image.save(os.path.join(IMG_TEST_PATH, image_file.name))

    # run yolo on test image. it should overwrite the same image with its result
    subprocess.check_output([DARKFLOW_PATH + "/flow",
                             "--imgdir", IMG_TEST_PATH,
                             "--outdir", IMG_TEST_PATH,
                             "--model", DARKFLOW_PATH + DARKFLOW_CFG,
                             "--load", DARKFLOW_PATH + DARKFLOW_WEIGHTS,
                             "--threshold", str(confidence),
                             "--saveImages"], stderr=subprocess.STDOUT)


    # return the url path to the test result
    return "admin_yolo_test/" + image_file.name


class YoloError(Exception):
    pass
