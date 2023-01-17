import os
from os.path import join
import json

with open("file_map.json", 'r') as f:
    folder_map = json.load(f)

with open("source_folders.txt", 'r') as f:
    source_folders = f.readlines()

with open("destination_folder.txt", r) as f:
    destination_folder = f.readline()

images = join(destination_folder, "images")
videos = join(destination_folder, "videos")
spreadsheets = join(destination_folder, "spreadsheets")
word_docs = join(destination_folder, "word_docs")
pdfs = join(destination_folder, "pdfs")

def 