import os
from os.path import join
import json

with open("file_extensions.json", 'r') as f:
    d = json.loads(f)
    print(d)