import os
import shutil
import subprocess
from PIL import Image

base_path = "/home/yolo/PycharmProjects/darkflow/script/images"
images_src_path = base_path + "/darkflow_images_src"
images_wrk_path = base_path + "/darkflow_images_wrk"
images_dst_path = base_path + "/darkflow_images_dst"

darkflow_path = "/home/yolo/PycharmProjects/darkflow"
darkflow_cfg = "/cfg/tiny-yolo-voc.cfg"
darkflow_weights = "/bin/tiny-yolo-voc.weights"
darkflow_threshold = "0.25"

accepted_formats = [".jpg", ".jpeg", ".png"]
thumb_img_size = [100, 150]
work_img_size = [800, 600]

images_src_dir = os.fsencode(images_src_path)

# move the images to a work folder
for file in os.listdir(images_src_path):
    file_ext = os.path.splitext(file)[1]
    if file_ext in accepted_formats:
        # TODO: change back to move instead of copy
        # os.rename(images_src_path + "/" + file, images_wrk_path + "/" + file)
        shutil.copy2(images_src_path + "/" + file, images_wrk_path)
    else:
        print("Invalid file format " + file)

# run yolo on the images
process = subprocess.run([darkflow_path + "/flow",
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
            print("cannot create thumbnail images for '%s'" % file)
            print(e)

# TODO: don't delete images in destination folder
for file in os.listdir(images_dst_path):
    os.remove(images_dst_path + "/" + file)

# move images into the destination folder
for file in os.listdir(images_wrk_path):
    os.rename(images_wrk_path + "/" + file, images_dst_path + "/" + file)

# divide images into batches, creating a gTrack issue for each batch
