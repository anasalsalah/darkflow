import os
import shutil
import glob
from yoloGUI import yolo_settings as settings
from yoloGUI import yolo_redmine as yolo_redmine
from datetime import datetime
import subprocess
from PIL import Image


BASE_PATH = settings.IMAGES_ROOT
BASE_URL = settings.BASE_URL

images_src_path = os.path.join(BASE_PATH, "darkflow_images_src")
images_wrk_path = os.path.join(BASE_PATH, "darkflow_images_wrk")
images_dst_path = os.path.join(BASE_PATH, "darkflow_images_dst")

images_batch_size = 10

darkflow_path = "/home/yolo/PycharmProjects/darkflow"
darkflow_cfg = "/cfg/tiny-yolo-voc.cfg"
darkflow_weights = "/bin/tiny-yolo-voc.weights"
darkflow_threshold = "0.25"

accepted_formats = [".jpg", ".JPG", ".jpeg", ".JPEG", ".png", ".PNG"]
thumb_img_size = [100, 150]
work_img_size = [1280, 1024]


def start():
    # check the most recent file and check for 20-second time difference
    # to ensure that file transfer process of images has completed
    src_files = glob.glob(images_src_path + '/*')  # * means all, if need specific format then *.csv
    while True:
        latest_file = max(src_files, key=os.path.getmtime)
        time_file = os.path.getmtime(latest_file)
        time_now = datetime.now().timestamp()

        if time_now - time_file > 20:
            break

    # copy the images from the source folder to the work folder
    src_files = os.listdir(images_src_path)
    for file in src_files:
        file_ext = os.path.splitext(file)[1]
        if file_ext in accepted_formats:
            shutil.copy2(os.path.join(images_src_path, file), images_wrk_path)
        else:
            print("Invalid file format: " + file)

    # store list of original images BEFORE generating more files
    work_files = os.listdir(images_wrk_path)

    # run yolo on the images to produce json data files (no images)
    subprocess.run([darkflow_path + "/flow",
                          "--imgdir", images_wrk_path,
                          "--model", darkflow_path + darkflow_cfg,
                          "--load", darkflow_path + darkflow_weights,
                          "--threshold", darkflow_threshold,
                          "--json"], stdout=subprocess.PIPE)

    # generate thumbnail and workspace versions of the images
    for file in work_files:
        file_ext = os.path.splitext(file)[1]
        file_path = os.path.join(images_wrk_path, file)
        if file_ext in accepted_formats:
            try:
                img = Image.open(file_path)
                img.thumbnail(thumb_img_size, Image.ANTIALIAS)
                thumb_file = os.path.splitext(file_path)[0] + "_thumb" + file_ext
                img.save(thumb_file, "JPEG")

                img = Image.open(file_path)
                img.thumbnail(work_img_size, Image.ANTIALIAS)
                work_file = os.path.splitext(file_path)[0] + "_work" + file_ext
                img.save(work_file, "JPEG")

            except IOError as e:
                print("cannot create thumbnail/work images for '%s'" % file)
                print(e)

    # create batches of images in folders named after timestamp
    counter = 0
    dir_name = ""
    for file in work_files:
        # create new directory for every batch of images
        if counter % images_batch_size == 0:
            ts = str(datetime.now().timestamp()).replace(".", "-")
            dir_name = os.path.join(images_dst_path, ts)
            os.mkdir(dir_name)
            # create gTrack issue for this batch
            yolo_redmine.create_issue(dir_name)

        file_name = os.path.splitext(file)[0]
        file_ext = os.path.splitext(file)[1]
        # move the image and its associated files to the batch directory
        os.rename(os.path.join(images_wrk_path, file),
                  os.path.join(dir_name, file_name + "_origin" + file_ext))
        os.rename(os.path.join(images_wrk_path, file_name + "_work" + file_ext),
                  os.path.join(dir_name, file_name + "_work" + file_ext))
        os.rename(os.path.join(images_wrk_path, file_name + "_thumb" + file_ext),
                  os.path.join(dir_name, file_name + "_thumb" + file_ext))
        os.rename(os.path.join(images_wrk_path, file_name + ".json"),
                  os.path.join(dir_name, file_name + ".json"))
        counter += 1

    # finally, remove the list of files from the source folder
    for file in src_files:
        file_path = os.path.join(images_src_path, file)
        os.remove(file_path)


def cleanup():
    for file in os.listdir(images_wrk_path):
        os.remove(file)


try:
    start()
except (ConnectionError, FileNotFoundError) as e:
    cleanup()
    print("An exception occurred: " + e)
