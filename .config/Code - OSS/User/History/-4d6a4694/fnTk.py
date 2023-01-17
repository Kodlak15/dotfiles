import os
from os.path import join, split
import json
from typing import Union

def get_destination_folder(ext: str) -> Union[str, None]:
    if ext in folder_map["images"]:
        return images
    elif ext in folder_map["videos"]:
        return videos
    elif ext in folder_map["spreadsheets"]:
        return spreadsheets
    elif ext in folder_map["word_docs"]:
        return word_docs
    elif ext in folder_map["pdfs"]:
        return pdfs
    else:
        return None

def move_files(source_folder: str) -> None:
    for filename in os.listdir(source_folder):
        ext = split(filename)[-1]

    if not destination_folder:
        return

    source = join(source_folder, filename)
    destination = join(destination_folder, filename)
    os.rename(source, destination)

if __name__ == "__main__":
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

    for source_folder in source_folders:
        for filename in os.listdir(source_folder):
            ext = split(filename)[-1]