import os
import shutil
import glob
import datetime
import subprocess
import requests
from PIL import Image
import json

base_path = "/home/yolo/PycharmProjects/darkflow/yoloGUI/images"
images_src_path = base_path + "/darkflow_images_src"
images_wrk_path = base_path + "/darkflow_images_wrk"
images_dst_path = base_path + "/darkflow_images_dst"

images_batch_size = 5

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
    list_of_files = glob.glob(images_src_path + '/*')  # * means all, if need specific format then *.csv
    while True:
        latest_file = max(list_of_files, key=os.path.getmtime)
        time_file = os.path.getmtime(latest_file)
        time_now = datetime.datetime.now().timestamp()

        if time_now - time_file > 20:
            break

    # move the images to a work folder
    for file in os.listdir(images_src_path):
        file_ext = os.path.splitext(file)[1]
        if file_ext in accepted_formats:
            # TODO: change back to move instead of copy
            # os.rename(os.path.join(images_src_path, file), os.path.join(images_wrk_path, file))
            shutil.copy2(os.path.join(images_src_path, file), images_wrk_path)
        else:
            print("Invalid file format: " + file)

    # store list of original images
    list_of_files = os.listdir(images_wrk_path)
    # TODO: how to handle errors? rollback? send email?
    # run yolo on the images
    subprocess.run([darkflow_path + "/flow",
                          "--imgdir", images_wrk_path,
                          "--model", darkflow_path + darkflow_cfg,
                          "--load", darkflow_path + darkflow_weights,
                          "--threshold", darkflow_threshold,
                          "--json"], stdout=subprocess.PIPE)

    # generate thumbnail and workspace versions of the images
    for file in os.listdir(images_wrk_path):
        file_ext = os.path.splitext(file)[1]
        file_path = images_wrk_path + "/" + file
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
    for file in list_of_files:
        # create new directory for every batch of images
        if counter % images_batch_size == 0:
            ts = str(datetime.datetime.timestamp()).replace(".", "-")
            dir_name = os.path.join(images_dst_path, ts)
            os.mkdir(dir_name)
            # create gTrack issue for this batch
            gtrack_create_issue(dir_name)

        file_name = os.path.splitext(file)[0]
        # move the image and its associated files to the batch directory
        os.rename(os.path.join(images_src_path, file), os.path.join(dir_name, file))
        os.rename(os.path.join(images_src_path, file_name + "_work.JPEG"), os.path.join(dir_name, file))
        os.rename(os.path.join(images_src_path, file_name + "_thumb.JPEG"), os.path.join(dir_name, file))
        os.rename(os.path.join(images_src_path, file_name + ".json"), os.path.join(dir_name, file))
        counter += 1

    # delete older images in destination
    # for file in os.listdir(images_dst_path):
    #     os.remove(images_dst_path + "/" + file)
    # move images into the destination folder
    # for file in os.listdir(images_wrk_path):
    #     os.rename(images_wrk_path + "/" + file, images_dst_path + "/" + file)

    # divide images into batches, creating a gTrack issue for each batch


def gtrack_create_issue(dir_name):

    gtrack_request_url = "https://gtools.globalme.net/gTrack"
    gtrack_request_header = {"Content-Type": "application/json",
                             "X-Redmine-API-Key": "61c204ee38bf778a4f16f44383b203539c0ba5eb"}

    # r = requests.get(gTrack_request_URL + "/issues.json?issue_id=67448&offset=0&limit=1",
    #                  headers=gTrack_request_header)
    # print(r.status_code, r.reason, r.content, "\n")

    json_data = {"issue": {"subject": "Example", "description": "This is a description", "project_id": 354,
                           "priority_id": 4, "status_id": 1, "author_id": 1120,  # "tracker_id": 2,
                           "custom_fields": [{"value": "globalme.net", "name": "Globalme Application", "id": 52}]
                           }}

    r = requests.post(gtrack_request_url + "/issues.json",
                      headers=gtrack_request_header,
                      data=json.dumps(json_data))

    # "custom_fields":[{"value": "globalme.net", "name": "Globalme Application", "id": 52}]}
    print(r.status_code, r.reason, r.content, "\n")

    # r = requests.put(gTrack_request_URL + "/issues/67447.json",
    #                  headers=gTrack_request_header,
    #                  data={"issue": {"status": {"id": 17, "name": "In Progress"},
    #                                  "notes": "The status was changed to In Progress"}})
    # print(r.status_code, r.reason, r.content, "\n")


start()
# gTrack_create_issue()
