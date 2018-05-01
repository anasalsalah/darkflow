import numpy as np
import cv2
import os
import json
# from scipy.special import expit
# from utils.box import BoundBox, box_iou, prob_compare
# from utils.box import prob_compare2, box_intersection
from ...utils.box import BoundBox
from ...cython_utils.cy_yolo2_findboxes import box_constructor


def expit(x):
    return 1. / (1. + np.exp(-x))


def _softmax(x):
    e_x = np.exp(x - np.max(x))
    out = e_x / e_x.sum()
    return out


def findboxes(self, net_out):
    # meta
    meta = self.meta
    boxes = list()
    boxes = box_constructor(meta, net_out)
    return boxes


def postprocess(self, net_out, im, save_image=True, video_frame_num=0):
    """
	Takes net output, draw net_out, save to disk
	"""
    boxes = self.findboxes(net_out)

    # meta
    meta = self.meta
    threshold = meta['thresh']
    colors = meta['colors']
    # AAA: check if selected labels have been passed
    selected_labels = meta['selected_labels'] if 'selected_labels' in meta.keys() else None
    if type(im) is not np.ndarray:
        imgcv = cv2.imread(im)
    else:
        imgcv = im
    h, w, _ = imgcv.shape

    resultsForJSON = []
    for b in boxes:
        boxResults = self.process_box(b, h, w, threshold)
        if boxResults is None:
            continue
        left, right, top, bot, mess, max_indx, confidence = boxResults
        # AAA: if there are selected labels, filter out the ones not selected
        if selected_labels and mess not in selected_labels:
            # print("label " + mess + " is not in the list of selected labels. Skipping.")
            continue

        thick = int((h + w) // 300)
        if self.FLAGS.json:
            resultsForJSON.append(
                {"label": mess, "confidence": float('%.2f' % confidence), "topleft": {"x": left, "y": top},
                 "bottomright": {"x": right, "y": bot}})

        cv2.rectangle(imgcv,
                      (left, top), (right, bot),
                      colors[max_indx], thick)
        cv2.putText(imgcv, mess, (left, top - 12),
                    0, 1e-3 * h, colors[max_indx], thick // 3)

    # AAA: check if this is a single image, then check if save image
    if video_frame_num == 0:  # saving image file
        out_folder = os.path.join(self.FLAGS.imgdir, 'out')
        img_name = os.path.join(out_folder, os.path.basename(im))
        if save_image:
            cv2.imwrite(img_name, imgcv)

    # AAA: save json file for image, or append info for video's json file
    if self.FLAGS.json:
        json_text = json.dumps(resultsForJSON)
        if video_frame_num == 0:  # saving json for image file
            json_file = os.path.splitext(img_name)[0] + ".json"
            with open(json_file, 'w') as f:
                f.write(json_text)
        else:  # saving json for video file
            json_file = os.path.splitext(self.FLAGS.demo)[0] + ".json"
            with open(json_file, 'a+') as f:
                f.write("{\"Frame %d\":\n %s\n},\n" % (video_frame_num, json_text))

    return imgcv
