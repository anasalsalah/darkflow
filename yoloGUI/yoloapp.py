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
MEDIA_ROOT = os.path.join(BASE_DIR, "samples")
MEDIA_URL = '/samples/'

DEBUG = True
SECRET_KEY = '4l0ngs3cr3tstr1ngw3lln0ts0l0ngw41tn0w1tsl0ng3n0ugh'
TEMPLATES = [{'BACKEND': 'django.template.backends.django.DjangoTemplates',
              'DIRS': [BASE_DIR],
              }]


def home(request):
    return HttpResponse('<h1 style="color:green">Welcome to the Yoloapp!</h1>'
                        'Please use the URL in the issue assigned to you on gTrack.')


# http://127.0.0.1:8000/folder?folder_id=1234
def view_folder(request):
    # get the folder id
    folder_id = request.GET.get('folder_id', '')

    # extract the images, thumbs, and jsons from the folder

    # images_array = []
    # thumbnails_array = []
    # json_files_array = []

    # django_engine = engines['django']
    # template = django_engine.from_string(folder_template)
    # html = template.render({'images_array': images_array,
    #                         'thumbnails_array': thumbnails_array,
    #                         'json_files_array': json_files_array})

    html = render_to_string('index.html', {'folder_id': folder_id})
    return HttpResponse(html)


urlpatterns = [
    url(r'^$', home, name='homepage'),
    url(r'^folder$', view_folder, name='viewfolder'),
    url(r'^save_json$', view_folder, name='savejson'),
    url(r'^save_issue$', view_folder, name='saveissue'),
] + static(MEDIA_URL, document_root=MEDIA_ROOT) + static(STATIC_URL, document_root=STATIC_ROOT)




