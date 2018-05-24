import sys
import os
import logging

from django.http import HttpResponse
from django.conf.urls import url
from django.template.loader import render_to_string
from django.conf.urls.static import static

sys.path.append('../')  # allows importing from the module this file is in
from yoloGUI import yolo_redmine as yolo_redmine
from yoloGUI import yolo_settings as settings


ROOT_URLCONF = __name__

DEBUG = True
ALLOWED_HOSTS = ['*']
SECRET_KEY = '4l0ngs3cr3tstr1ngw3lln0ts0l0ngw41tn0w1tsl0ng3n0ugh'
TEMPLATES = [{'BACKEND': 'django.template.backends.django.DjangoTemplates', 'DIRS': [settings.BASE_DIR]}]
ERROR_HEADER = '<h1 style="color:green">Welcome to the Yoloapp!</h1>'

LOGGING = settings.LOGGING
logger = logging.getLogger(__name__)


def home(request):
    logger.error("GET request failed: home page. Folder ID or Issue ID parameter is empty.")
    return HttpResponse(ERROR_HEADER +
                        'Please use the URL in the issue assigned to you on gTrack.', status=401)


def get_labels(request):
    logger.debug("GET request: list of objects and their parts.")
    file_path = os.path.join(settings.STATIC_ROOT, "labels.json")

    with open(file_path, 'r') as labels_file:
        json_content = labels_file.read()

    return HttpResponse(json_content)


def get_json(request):
    logger.debug("GET request start: json data for an image.")
    json_param = request.GET.get('json_file', '')
    file_path = os.path.join(settings.MEDIA_ROOT, json_param)

    with open(file_path, 'r') as json_file:
        json_content = json_file.read()

    logger.debug("GET request success: json data for an image.")
    return HttpResponse(json_content)


def save_json(request):
    logger.debug("POST request start: json data for an image.")
    json_file_param = request.GET.get('json_file', '')
    json_text_param = request.GET.get('json_text', '')

    file_path = os.path.join(settings.MEDIA_ROOT, json_file_param)

    with open(file_path, 'w') as json_file:
        json_file.write(json_text_param)

    logger.debug("POST request success: json data for an image.")
    return HttpResponse('File saved successfully.')


def update_issue(request):
    logger.debug("POST request start: update Redmine issue.")
    issue_id_param = request.GET.get('issue_id', '')
    folder_id_param = request.GET.get('folder_id', '')

    try:
        yolo_redmine.update_issue_status(int(issue_id_param), str(folder_id_param), yolo_redmine.REDMINE_STATUS_DONE)
    except (ConnectionError, TypeError) as e:
        logger.exception("POST request fail: update Redmine issue. Exception: " + str(e))
        return HttpResponse('An error occurred while updating the issue:' + str(e), status=500)

    logger.debug("POST request success: update Redmine issue.")
    return HttpResponse('Issue updated successfully.')


def view_admin(request):
    logger.debug("GET request start: view admin.")
    html = render_to_string('pages/admin.html')
    logger.debug("GET request success: view admin.")
    return HttpResponse(html)


def view_folder(request):
    logger.debug("GET request start: view folder.")
    # get the folder id
    folder_id = request.GET.get('folder_id', '')
    issue_id = request.GET.get('issue_id', '')
    images_folder = os.path.join(settings.MEDIA_ROOT, folder_id)

    if issue_id == '' or folder_id == '':
        logger.error("GET request failed: view folder. Folder ID or Issue ID parameter is empty.")
        return HttpResponse(ERROR_HEADER +
                'Unauthorized access. Please login to gTrack and access your work from there.', status=401)
    try:
        list_of_files = os.listdir(images_folder)
    except FileNotFoundError:
        logger.error("GET request failed: view folder. Folder does not exist.")
        return HttpResponse(ERROR_HEADER +
                'The folder you are trying to access does not exist. Please contact your project manager.', status=404)
    if list_of_files.__len__() == 0:
        logger.error("GET request failed: view folder. Folder is empty.")
        return HttpResponse(ERROR_HEADER +
                'The folder you are trying to access is empty. Please contact your project manager.', status=404)
    images_array = []
    for file in list_of_files:
        file_name = os.path.splitext(os.path.basename(file))[0]
        file_ext = os.path.splitext(os.path.basename(file))[1]
        # TODO: if the image is uploaded with file name ending with "_original", the image does not display in the GUI.
        if file_name.endswith("_original"):
            file_name = file_name.split("_original")[0]

            images_array.append(WorkImage(settings.MEDIA_URL + folder_id + "/" + file_name + "_work" + file_ext,
                                          settings.MEDIA_URL + folder_id + "/" + file_name + "_thumb" + file_ext,
                                          folder_id + "/" + file_name + ".json"))

    html = render_to_string('pages/index.html', {'folder_id': folder_id,
                                           'issue_id': issue_id,
                                           'images_array': images_array})
    return HttpResponse(html)


urlpatterns = [
    url(r'^$', home, name='homepage'),
    url(r'^admin$', view_admin, name='viewadmin'),
    url(r'^folder$', view_folder, name='viewfolder'),
    url(r'^get_labels$', get_labels, name='getlabels'),
    url(r'^get_json$', get_json, name='getjson'),
    url(r'^save_json$', save_json, name='savejson'),
    url(r'^update_issue$', update_issue, name='updateissue'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) \
              + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)


# TODO: add status for WorkImage from json file
class WorkImage:

    def __init__(self, work_image, thumb_image, json_file):
        self.work_image = work_image
        self.thumb_image = thumb_image
        self.json_file = json_file
