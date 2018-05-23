## Intro


The YOLO GUI is a simple web app that is built on [Darkflow](https://github.com/thtrieu/darkflow). Darkflow is an object detection algorithm that can detect people, cars, animals, and other things in images and videos.

As an admin, you can kick off a job that will:
- run darkflow on a set of images in a folder. The output is a set of JSON files (one JSON file for each image) containing the objects annotation information, which are bounding boxes drawn over the detected objects with labels indicating what the objects are.
- create a web-resolution image and a thumbnail image for each image file (for use in the YOLO GUI).
- divide the images with their json annotations into batches.
- create a Redmine issue for each batch, containing a URL to the YOLO GUI for that specific batch.

As an annotator, you access the generated URL on Redmine. This opens the YOLO GUI for that particular batch of images. From there, you can:
- View darkflow's annotations on the images, drawn dynamically.
- Create new boxes and annotations.
- Modify or delete existing boxes and annotations.
- Your work is automatically saved to the server as you navigate from one image to the other.
- When you have finished working on all images, you can update the Redmine issue to a "Done" status.

This is a screenshot of the YOLO GUI main screen:
<p align="center"> <img width="800" src="preview.png"/> </p>

## Dependencies

For Darkflow: Python3, tensorflow 1.0, numpy, opencv3
For YOLO GUI: Django 3.5, Nginx, Gunicorn

### Getting started
1- Clone this repository. Install all dependencies above.

2- Build darkflow:
    ```
    python3 setup.py build_ext --inplace
    ```

2- Setup Nginx and Gunicorn.

3- Setup an FTP account and a folder for uploading images.

4- Setup the YOLO GUI by modifying the settings in each of the python files under yoloGUI: yolo_admin, yolo_app, yolo_redmine, and yolo_settings.py.

5- Development mode: Run the django server:
    ```
    django-admin runserver --pythonpath=. --settings=yolo_app
    ```