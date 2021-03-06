"""
tfnet secondary (helper) methods
"""
from ..utils.loader import create_loader
from time import time as timer
import tensorflow as tf
import sys
import cv2
import os

old_graph_msg = 'Resolving old graph def {} (no guarantee)'


def build_train_op(self):
    self.framework.loss(self.out)
    self.say('Building {} train op'.format(self.meta['model']))
    optimizer = self._TRAINER[self.FLAGS.trainer](self.FLAGS.lr)
    gradients = optimizer.compute_gradients(self.framework.loss)
    self.train_op = optimizer.apply_gradients(gradients)


def load_from_ckpt(self):
    if self.FLAGS.load < 0: # load lastest ckpt
        with open(os.path.join(self.FLAGS.backup, 'checkpoint'), 'r') as f:
            last = f.readlines()[-1].strip()
            load_point = last.split(' ')[1]
            load_point = load_point.split('"')[1]
            load_point = load_point.split('-')[-1]
            self.FLAGS.load = int(load_point)

    load_point = os.path.join(self.FLAGS.backup, self.meta['name'])
    load_point = '{}-{}'.format(load_point, self.FLAGS.load)
    self.say('Loading from {}'.format(load_point))
    try: self.saver.restore(self.sess, load_point)
    except: load_old_graph(self, load_point)

def say(self, *msgs):
    if not self.FLAGS.verbalise:
        return
    msgs = list(msgs)
    for msg in msgs:
        if msg is None: continue
        print(msg)

def load_old_graph(self, ckpt):
    ckpt_loader = create_loader(ckpt)
    self.say(old_graph_msg.format(ckpt))

    for var in tf.global_variables():
        name = var.name.split(':')[0]
        args = [name, var.get_shape()]
        val = ckpt_loader(args)
        assert val is not None, \
        'Cannot find and load {}'.format(var.name)
        shp = val.shape
        plh = tf.placeholder(tf.float32, shp)
        op = tf.assign(var, plh)
        self.sess.run(op, {plh: val})

def _get_fps(self, frame):
    start = timer()
    preprocessed = self.framework.preprocess(frame)
    feed_dict = {self.inp: [preprocessed]}
    net_out = self.sess.run(self.out, feed_dict)[0]
    self.framework.postprocess(net_out, frame, False)
    return timer() - start

def camera(self):
    video_source = self.FLAGS.demo
    save_video = self.FLAGS.saveVideo

    if video_source == 'camera':
        video_source = 0
    else:
        assert os.path.isfile(video_source), 'file {} does not exist'.format(video_source)

    camera = cv2.VideoCapture(video_source)

    self.say('Press [ESC] to quit demo')

    assert camera.isOpened(), 'Cannot capture source'

    cv2.namedWindow('yolo', 0)
    _, frame = camera.read()
    height, width, _ = frame.shape
    cv2.resizeWindow('', width, height)

    if self.FLAGS.json:  # AAA: delete the json file if it exists from a previous run
        json_file = os.path.splitext(self.FLAGS.demo)[0] + ".json"
        if os.path.isfile(json_file):
            os.remove(json_file)  # delete the file if found

    if save_video:
        # AAA: check opencv version and configure videoWriter accordingly
        print("Saving the video using opencv version: " + cv2.__version__)
        cv_is_v2 = cv2.__version__.startswith("2")
        fourcc = cv2.cv.CV_FOURCC(*'XVID') if cv_is_v2 else cv2.VideoWriter_fourcc(*'XVID')
        if video_source == 0:  # camera window
          fps = 1 / self._get_fps(frame)
          if fps < 1:
            fps = 1
        else:
            fps = round(camera.get(cv2.cv.CV_CAP_PROP_FPS)) if cv_is_v2 else round(camera.get(cv2.CAP_PROP_FPS))

        output_video_path = os.path.splitext(self.FLAGS.demo)[0] + "_yolo" + ".avi"
        videoWriter = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

    # buffers for demo in batch
    buffer_inp = list()
    buffer_pre = list()

    elapsed = int()
    start = timer()
    self.say('Press [ESC] to quit demo')
    # Loop through frames
    while camera.isOpened():
        elapsed += 1
        _, frame = camera.read()
        if frame is None:
            print ('\nEnd of Video')
            break
        preprocessed = self.framework.preprocess(frame)
        buffer_inp.append(frame)
        buffer_pre.append(preprocessed)

        # Only process and imshow when queue is full
        if elapsed % self.FLAGS.queue == 0:
            feed_dict = {self.inp: buffer_pre}
            net_out = self.sess.run(self.out, feed_dict)
            for img, single_out in zip(buffer_inp, net_out):
                # TODO: fix frame_number parameter below to account for queue size.
                # AAA: For now it's just set to "elapsed", assuming queue is set to 1.
                postprocessed = self.framework.postprocess(single_out, img, False, elapsed)
                if save_video:
                    videoWriter.write(postprocessed)
                # draw image to opencv window
                cv2.imshow('', postprocessed)
            # Clear Buffers
            buffer_inp = list()
            buffer_pre = list()

        if elapsed % 5 == 0:
            sys.stdout.write('\r')
            sys.stdout.write('{0:3.3f} FPS'.format(
                elapsed / (timer() - start)))
            sys.stdout.flush()

        choice = cv2.waitKey(1)
        if choice == 27: break

    sys.stdout.write('\n')
    if save_video:
        videoWriter.release()

    camera.release()
    cv2.destroyAllWindows()


def to_darknet(self):
    darknet_ckpt = self.darknet

    with self.graph.as_default() as g:
        for var in tf.global_variables():
            name = var.name.split(':')[0]
            var_name = name.split('-')
            l_idx = int(var_name[0])
            w_sig = var_name[1].split('/')[-1]
            l = darknet_ckpt.layers[l_idx]
            l.w[w_sig] = var.eval(self.sess)

    for layer in darknet_ckpt.layers:
        for ph in layer.h:
            layer.h[ph] = None

    return darknet_ckpt
