import requests
import json
import os
from yoloGUI import yolo_settings as yolo_settings

REQUEST_URL = "https://redmine.globalme.net"
REQUEST_HEADER = {"Content-Type": "application/json",
                  "X-Redmine-API-Key": "61c204ee38bf778a4f16f44383b203539c0ba5eb"}

REDMINE_YOLO_PROJECT_ID = 354
REDMINE_STATUS_NEW = 1
REDMINE_STATUS_DONE = 58


def update_issue_status(issue_id, folder_id, status_id):
    # update the new issue with the URL to the yolo app, containing folder name and issue ID
    jason_data = {"issue": {"status_id": status_id,
                            "notes": "The status was updated successfully."}}

    r = requests.put(REQUEST_URL + "/issues/" + str(issue_id) + ".json",
                     headers=REQUEST_HEADER,
                     data=json.dumps(jason_data))

    if r.status_code != 200:
        raise ConnectionError("ERROR - Updating issue status FAILED:  %s %s %s\n"
                              % (str(r.status_code), str(r.reason), str(r.content)))

    # return str(r.status_code), str(r.reason), str(r.content)


def create_issue(dir_name):
    # get the folder name
    dir_name = os.path.basename(dir_name)
    json_data = {"issue": {"subject": "YOLO Annotation Folder " + dir_name,
                           "description": "Access the URL provided and review YOLO's work",
                           "project_id": REDMINE_YOLO_PROJECT_ID,
                           "priority_id": 4, "status_id": REDMINE_STATUS_NEW,
                           "author_id": 1120, "assigned_to_id": 1120
                           }}

    r = requests.post(REQUEST_URL + "/issues.json",
                      headers=REQUEST_HEADER,
                      data=json.dumps(json_data))

    if r.status_code != 201:
        raise ConnectionError("ERROR - Redmine Issue Creation FAILED: %s %s %s\n"
                              % (str(r.status_code), str(r.reason), str(r.content)))

    # get the issue ID from the response json data
    json_response = json.loads(r.content.decode("utf-8"))
    issue_id = json_response['issue']['id']
    issue_url = yolo_settings.BASE_URL + "/folder?folder_id=" + dir_name + "&issue_id=" + str(issue_id)
    jason_data = {"issue": {"custom_fields": [{"id": 28, "name": "URL", "value": issue_url}]}}
    # "notes": "The URL was inserted successfully.", "status": {"id": issue_id},

    # update the new issue with the URL to the yolo app, containing folder name and issue ID
    r = requests.put(REQUEST_URL + "/issues/" + str(issue_id) + ".json",
                     headers=REQUEST_HEADER,
                     data=json.dumps(jason_data))

    if r.status_code == 200:
        result_message = "Redmine issue created and URL appended successfully. Issue ID: %s\n" % str(issue_id)
        return issue_id, result_message
    else:
        raise ConnectionError("ERROR - Appending URL to Redmine issue FAILED: %s %s %s\n"
                              % (str(r.status_code), str(r.reason), str(r.content)))

