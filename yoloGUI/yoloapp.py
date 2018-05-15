import os

from django.http import HttpResponse
from django.conf.urls import url
# from django.template import engines
from django.template.loader import render_to_string
# from django.conf import settings
from django.conf.urls.static import static


ROOT_URLCONF = __name__
# "/home/yolo/PycharmProjects/darkflow/yoloGUI/"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.0/howto/static-files/
STATIC_ROOT = os.path.join(BASE_DIR, "resources")
STATIC_URL = '/resources/'
MEDIA_ROOT = os.path.join(BASE_DIR, "images/darkflow_images_dst")
MEDIA_URL = '/images/'

DEBUG = True
SECRET_KEY = '4l0ngs3cr3tstr1ngw3lln0ts0l0ngw41tn0w1tsl0ng3n0ugh'
TEMPLATES = [{'BACKEND': 'django.template.backends.django.DjangoTemplates',
              'DIRS': [BASE_DIR],
              }]

ERROR_HEADER = '<h1 style="color:green">Welcome to the Yoloapp!</h1>'


def home(request):
    return HttpResponse(ERROR_HEADER +
                        'Please use the URL in the issue assigned to you on gTrack.')


def get_json(request):
    json_param = request.GET.get('json_file', '')
    file_path = os.path.join(MEDIA_ROOT, json_param)

    with open(file_path, 'r') as json_file:
        json_content = json_file.read()

    return HttpResponse(json_content)


def save_json(request):
    json_file_param = request.GET.get('json_file', '')
    json_text_param = request.GET.get('json_text', '')

    file_path = os.path.join(MEDIA_ROOT, json_file_param)

    with open(file_path, 'w') as json_file:
        json_file.write(json_text_param)

    return HttpResponse('File saved successfully.')


# http://127.0.0.1:8000/folder?folder_id=1234
def view_folder(request):
    # get the folder id
    folder_id = request.GET.get('folder_id', '')
    issue_id = request.GET.get('issue_id', '')
    images_folder = os.path.join(MEDIA_ROOT, folder_id)

    if issue_id == '' or folder_id == '':
        return HttpResponse(ERROR_HEADER +
                            'Unauthorized access. Please login to gTrack and access your work from there.')
    try:
        list_of_files = os.listdir(images_folder)
    except FileNotFoundError:
        return HttpResponse(ERROR_HEADER +
                            'The folder you are trying to access does not exist. Please contact your project manager.')
    if list_of_files.__len__() == 0:
        return HttpResponse(ERROR_HEADER +
                            'The folder you are trying to access is empty. Please contact your project manager.')

    images_array = []

    for file in list_of_files:
        file_name = os.path.splitext(os.path.basename(file))[0]
        file_ext = os.path.splitext(os.path.basename(file))[1]
        if file_name.endswith("_origin"):
            file_name = file_name.split("_origin")[0]

            images_array.append(WorkImage(MEDIA_URL + folder_id + "/" + file_name + "_work" + file_ext,
                                          MEDIA_URL + folder_id + "/" + file_name + "_thumb" + file_ext,
                                          folder_id + "/" + file_name + ".json"))

    html = render_to_string('index.html', {'folder_id': folder_id,
                                           'issue_id': issue_id,
                                           'images_array': images_array})
    return HttpResponse(html)


urlpatterns = [
    url(r'^$', home, name='homepage'),
    url(r'^folder$', view_folder, name='viewfolder'),
    url(r'^get_json$', get_json, name='getjson'),
    url(r'^save_json$', save_json, name='savejson'),
    url(r'^save_issue$', view_folder, name='saveissue'),
] + static(MEDIA_URL, document_root=MEDIA_ROOT) + static(STATIC_URL, document_root=STATIC_ROOT)


# TODO: add status for WorkImage from json file
class WorkImage:

    def __init__(self, work_image, thumb_image, json_file):
        self.work_image = work_image
        self.thumb_image = thumb_image
        self.json_file = json_file




